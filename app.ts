import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import "https://deno.land/x/dotenv/load.ts";

interface PageViewCount {
    count: number,
    resource: string
}

interface NetlifyResponse {
    data: Map<number, PageViewCount>
}

export const NETLIFY_TOKEN = Deno.env.get("NETLIFY_TOKEN")
export const NETLIFY_SITE_ID = Deno.env.get("NETLIFY_SITE_ID")

const router = new Router();
const netlifyEndPoint = `https://analytics.services.netlify.com/v2/${NETLIFY_SITE_ID}/ranking/pages/`

//GET BLOG VIEW COUNT
router.get('/blog', async (context) => {

    //NETLIFY ANALYTICS
    const response = await fetch(netlifyEndPoint, {
        headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
        },
    });

    const dataList: NetlifyResponse  = await response.json();
    const blogPostList: [string, number][] = [];

    for (const [, postDetail] of dataList.data.entries()) {
        const count = postDetail.count;
        const path = postDetail.resource;

        if(path.includes('/posts/')) {
            const blogPost = path.slice(7, path.length - 1) //yea whatever
            blogPostList.push([blogPost, count])
        }
    }
    context.response.body = {blogList: blogPostList}
})

const app = new Application();

// Logger
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });

export async function onRequestGet(context: EventContext<any, any, any>) {
    let keys: object;
    try {
        const res=  await context.env.DB.prepare("select * from data").run()
        keys = res.results
    } catch (error) {
        return new Response("Error", {status: 500});
    }

    if (keys === null || keys === undefined) {
        return new Response("Bad keys", {status: 500});
    }

    return new Response(JSON.stringify(keys));
}
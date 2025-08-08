export async function onRequestGet(context: EventContext<any, any, any>) {
    const keys = await context.env.PERSONAL_DATA_KV.list();
    if (keys === null || keys === undefined) {
        return new Response("Bad keys", {status: 500});
    }

    const items = await Promise.all(
        keys.keys.map(async (key) => [key, await context.env.PERSONAL_DATA_KV.get(key.name)])
    );

    console.log(JSON.stringify(items));

    return new Response(JSON.stringify(items));
}
// @ts-ignore
export async function onRequest(context: EventContext) {
    const result = [];

    for (let i = 0; i < 8; i++) {
        result.push(context.env[`LINK_${i}`]);
    }
    return new Response(JSON.stringify(result));
}
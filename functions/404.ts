export async function onRequest(context: EventContext<any, any, any>) {
    return new Response("404", {
        status: 404
    });
}
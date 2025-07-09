export async function onRequestPost(context: EventContext<any, any, any>) {
    const text = await context.request.text();
    if (!text) {
        return new Response("Bad Data", {status: 400});
    }

    await context.env.PERSONAL_DATA_KV.put(String(Date.now()), text);
    return new Response("Data submitted!");
}
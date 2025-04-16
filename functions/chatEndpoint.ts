// @ts-ignore
export async function onRequest(context: EventContext) {
    let json;
    try {
        json = await context.request.json()
    } catch (e) {
        return new Response(null, {
            status: 400
        })
    }
    return new Response(JSON.stringify({ "answer": "I did a thing with q " + json["question"]
    + " cuz im the model " + json["model"] + " and my system is " + json["system"]}));
}
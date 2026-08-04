export async function onRequest(context: EventContext<any, any, any>) {
    return new Response("404", {
        status: 404
    });
}

export function genResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({message: message}), {
        headers: {"Content-Type": "application/json"},
        status: statusCode
    });
}
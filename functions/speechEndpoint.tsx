// this file written using AI, might be sloppy
export async function onRequest(context: EventContext<any, any, any>) {
    const upgradeHeader = context.request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
    }
    const openaiResponse = await fetch("https://api.openai.com/v1/realtime?intent=transcription", {
        headers: {
            "Authorization": `Bearer ${context.env.OPENAI_KEY}`,
            "Upgrade": "websocket",
            "Connection": "Upgrade"
        }
    });

    const openaiWs = openaiResponse.webSocket;
    if (!openaiWs) {
        return new Response('Failed to connect to OpenAI', { status: 502 });
    }
    openaiWs.accept();

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    server.accept();

    server.addEventListener('message', (event) => {
        openaiWs.send(event.data);
    });
    openaiWs.addEventListener('message', (event) => {
        server.send(event.data);
    });

    server.addEventListener('close', (e) => {
        console.log("Client closed connection", e.code, e.reason);
        openaiWs.close(e.code, e.reason);
    });
    openaiWs.addEventListener('close', (e) => {
        console.log("OpenAI closed connection", e.code, e.reason);
        server.close(e.code, e.reason);
    });

    return new Response(null, {
        status: 101,
        webSocket: client
    });
}
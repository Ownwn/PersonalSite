import {models, Provider} from "../src/assets/constants";

export async function onRequestPost(context: EventContext<any, any, any>) {
    const error = genErrorResponse("Error: Invalid Question", 400);


    let userData;

    try {
        userData = await context.request.json();
    } catch (e) {
        return error;
    }


    if (!userData.question || userData.system_prompt === undefined) {
        return error;
    }

    const modelId = Number(userData.model_id);
    if (modelId === undefined || Number.isNaN(modelId) || modelId < 0 || modelId >= models.length) {
        return error;
    }

    const provider = models[modelId].provider;

    const messageStream = await provider.buildStream(context.env, userData.question, models[modelId].api_name, userData.system_prompt)

    return stream(messageStream, provider)

}

function genErrorResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({message: message}), {
        headers: {"Content-Type": "application/json"},
        status: statusCode
    });
}


async function stream(messageStream, provider: Provider) {
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of messageStream) {
                    const text = provider.getText(chunk)
                    if (text != null) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(text)}\n\n`));
                    }
                }

            } catch (error) {
                console.error("Error streaming:", error);
                controller.error(error);
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        }
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    });
}

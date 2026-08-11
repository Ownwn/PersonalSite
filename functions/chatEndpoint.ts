import {models} from "../src/assets/constants";
import { genResponse } from "./404"

export async function onRequestPost(context: EventContext<any, any, any>) {
    const error = genResponse("Error: Invalid Question", 400);


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
    try {
        const messageStream = await provider.buildStream(context.env, userData.question, models[modelId].api_name, userData.system_prompt, userData.history, userData.reasoning, userData.options, models[modelId].reasoning)
        return stream(messageStream)
    } catch (err) {
        return genResponse(err.message, 500)
    }
}

async function stream(messageStream: Response) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");
    const reader = messageStream.body.getReader();
    let buffer = "";

    const stream = new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data:")) {
                            controller.enqueue(encoder.encode(line + "\n\n"));
                        }
                    }
                }
            } catch (error) {
                console.error("Error streaming:", error);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({error: error.message})}\n\n`));
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

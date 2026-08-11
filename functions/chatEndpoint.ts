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
        return new Response(messageStream.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        });
    } catch (err) {
        return genResponse(err.message, 500)
    }
}

import {models, Provider} from "../src/assets/constants";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

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

    if (provider === Provider.OPENAI) {
        const client = new OpenAI({
            apiKey: context.env.OPENAI_KEY
        });

        const message = await client.responses.create({
            model: models[modelId].api_name,
            max_output_tokens: 8192,
            instructions: userData.system_prompt,
            input: userData.question
        });

        return new Response(JSON.stringify(message.output_text), {
            headers: { "Content-Type": "application/json" }
        });

    } else if (provider === Provider.ANTHROPIC) {
        const client = new Anthropic({
            apiKey: context.env.CLAUDE_KEY
        });

        const message = await client.messages.create({
            messages: [{role: 'user', content: userData.question}],
            model: models[modelId].api_name,
            max_tokens: 8096,
            system: userData.system_prompt
        })

        return new Response(JSON.stringify(message.content[0].text), {
            headers: { "Content-Type": "application/json" }
        });

    } else {
        return genErrorResponse("Bad provider", 500)
    }


}

function genErrorResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({message: message}), {
        headers: {"Content-Type": "application/json"},
        status: statusCode
    });
}
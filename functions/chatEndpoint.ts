import { claudeEndpoint, models, openAiEndpoint } from "../src/assets/constants";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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

    const modelId = userData.model_id
    if (modelId === undefined || modelId < 0 || modelId >= models.length) {
        return error
    }

    const isClaude = modelId == 1;

    if (isClaude) {
        await streamClaudeMessage(context, modelId, userData.system_prompt)
    } else {
        await streamOpenAiMessage(context, modelId, userData.system_prompt)
    }


    const goodJson = { answer: "NYI" };

    return new Response(JSON.stringify(goodJson), {
        headers: { "Content-Type": "application/json" }
    });

}

function genErrorResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({ message: message }), {
        headers: { "Content-Type": "application/json" },
        status: statusCode
    });
}

async function streamClaudeMessage(context, modelId, systemPrompt) {
    const client = new Anthropic({
        apiKey: context.env.CLAUDE_KEY
    });

    const message = await client.messages.create({
        max_tokens: 8192,
        messages: [{ role: 'user', content: 'Hello, Claude' }],
        model: models[modelId].api_name,
        system: systemPrompt,
        stream: true
    });
    for await (const messageStreamEvent of message) {
        console.log(messageStreamEvent.type);
    }
    console.log("done!")
}

async function streamOpenAiMessage(context, modelId, systemPrompt) {

    const client = new OpenAI({
        apiKey: context.env.OPENAI_KEY
    });

    const response = await client.responses.create({
        model: 'gpt-4.1-nano',
        max_output_tokens: 8192,
        instructions: 'You are a coding assistant that talks like a pirate',
        input: 'Are semicolons optional in JavaScript?',
        stream: true
    });

    for await (const event of response) {
        if (event.delta) console.log(event.delta)

    }
    console.log(":done")
}
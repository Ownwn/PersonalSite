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

    const modelId = Number(userData.model_id)
    if (modelId === undefined || modelId < 0 || modelId >= models.length) {
        return error
    }

    const isClaude = modelId === 0; // fucky

    if (isClaude) {
        return streamClaudeMessage(context, modelId, userData.system_prompt, userData.question)
    } else {
        return streamOpenAiMessage(context, modelId, userData.system_prompt, userData.question)
    }
}

function genErrorResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({ message: message }), {
        headers: { "Content-Type": "application/json" },
        status: statusCode
    });
}

async function streamClaudeMessage(context, modelId: number, systemPrompt: string, userPrompt: string) {
    const client = new Anthropic({
        apiKey: context.env.CLAUDE_KEY
    });

    client.messages.stream({
        messages: [{role: 'user', content: "Hello"}],
        model: 'claude-3-5-haiku-latest',
        max_tokens: 1024,
    }).on('text', (text) => {
        console.log(text);
    });
    return new Response("nyi")
}

async function streamOpenAiMessage(context, modelId: number, systemPrompt: string, userPrompt: string) {
    const client = new OpenAI({
        apiKey: context.env.OPENAI_KEY
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const response = await client.responses.create({
                    model: models[modelId].api_name,
                    max_output_tokens: 8192,
                    instructions: systemPrompt,
                    input: userPrompt,
                    stream: true
                });

                for await (const event of response) {
                    if (event.delta) {
                        console.log(event.delta)
                        const data = `data: ${JSON.stringify(event.delta)}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                }

            } catch (error) {
                controller.error(error);
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        }
    });
    return new Response(stream, {
        headers: { "Content-Type": "text/event-stream"}
    });
}
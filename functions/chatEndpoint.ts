import { claudeEndpoint, models, openAiEndpoint } from "../src/assets/constants";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {use} from "react";

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

    let provider: Provider;
    if (modelId === 0) provider = Provider.ANTHROPIC
    else if (modelId === 1 || modelId === 2) provider = Provider.OPENAI


    console.log("here");
    if (provider === Provider.ANTHROPIC) {
        const client = new Anthropic({
            apiKey: context.env.CLAUDE_KEY
        });
        console.log("here2");
        return stream(client.messages.stream({
            messages: [{role: 'user', content: userData.question}],
            model: "claude-3-5-haiku-latest",
            max_tokens: 8096,
            system: userData.system_prompt
        }), provider)
        console.log("here3");
        return streamClaudeMessage(context, modelId, userData.system_prompt, userData.question)
    } else if (provider === Provider.OPENAI){
        const client = new OpenAI({
            apiKey: context.env.OPENAI_KEY
        });

        return stream(await client.responses.create({
            model: models[modelId].api_name,
            max_output_tokens: 8192,
            instructions: userData.system_prompt,
            input: userData.question,
            stream: true
        }), provider)

        return streamOpenAiMessage(context, modelId, userData.system_prompt, userData.question)
    }
    return genErrorResponse("Bad Provider", 400)
}

function genErrorResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({ message: message }), {
        headers: { "Content-Type": "application/json" },
        status: statusCode
    });
}

enum Provider {
    ANTHROPIC, OPENAI
}

async function stream(messageStream, provider: Provider) {
    console.log("strm");
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                console.log("okk");
                for await (const chunk of messageStream) {
                    console.log(provider, chunk);
                    if (provider === Provider.ANTHROPIC && chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        console.log("and then!");
                        const data = `data: ${JSON.stringify(chunk.delta.text)}\n\n`;
                        controller.enqueue(encoder.encode(data));

                    } else if (provider === Provider.OPENAI && chunk.delta) {
                        const data = `data: ${JSON.stringify(chunk.delta)}\n\n`;
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



async function streamClaudeMessage(context, modelId: number, systemPrompt: string, userPrompt: string) {
    const client = new Anthropic({
        apiKey: context.env.CLAUDE_KEY
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const stream = client.messages.stream({
                    messages: [{role: 'user', content: userPrompt}],
                    model: "claude-3-5-haiku-latest",
                    max_tokens: 8096,
                    system: systemPrompt
                });

                for await (const chunk of stream) {
                    console.log(chunk)
                    console.log(chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta')
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {

                        const data = `data: ${JSON.stringify(chunk.delta.text)}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                }

            } catch (error) {
                controller.error(error);
            }
            console.log("444")
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        }
    });
    return new Response(stream, {
        headers: { "Content-Type": "text/event-stream"}
    });
}


import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
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

    const modelId = Number(userData.model_id)
    if (modelId === undefined || Number.isNaN(modelId) || modelId < 0 || modelId >= models.length) {
        return error
    }

    const provider = models[modelId].provider

    if (provider === Provider.ANTHROPIC) {
        const client = new Anthropic({
            apiKey: context.env.CLAUDE_KEY
        });
        return stream(client.messages.stream({
            messages: [{role: 'user', content: userData.question}],
            model: models[modelId].api_name,
            max_tokens: 8096,
            system: userData.system_prompt
        }), provider)
        
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
    }
    
    return genErrorResponse("Bad Provider", 400)
}

function genErrorResponse(message: string, statusCode: number) {
    return new Response(JSON.stringify({ message: message }), {
        headers: { "Content-Type": "application/json" },
        status: statusCode
    });
}



async function stream(messageStream, provider: Provider) {
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of messageStream) {
                    if (provider === Provider.ANTHROPIC && chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
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

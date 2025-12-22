import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export class Provider {
    static ANTHROPIC = new Provider(chunk => {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            return chunk.delta.text;
        }
        return null
    }, async (env, question, model, system) => {
        const client = new Anthropic({
            apiKey: env.CLAUDE_KEY
        });
        return client.messages.stream({
            messages: [{role: 'user', content: question}],
            model: model,
            max_tokens: 8096,
            system: system
        })

    });

    static OPENAI = new Provider(chunk => {
        if (chunk.delta) {
            return chunk.delta;
        }
        return null;
    }, async (env, question, model, system) => {
        const client = new OpenAI({
            apiKey: env.OPENAI_KEY
        });

        return client.responses.create({
            model: model,
            max_output_tokens: 8192,
            instructions: system,
            input: question,
            stream: true
        });

    });

    private constructor(public getText: (chunk: any) => string | null, public buildStream: (env: any, question: string, model: string, system: string) => Promise<any>) {}
}

export const models = [
    { cute_name: `GPT 5.2`, api_name: "gpt-5.2-2025-12-11", provider: Provider.OPENAI },
    { cute_name: `Claude`, api_name: "claude-sonnet-4-5", provider: Provider.ANTHROPIC},
    { cute_name: `GPT-4`, api_name: "gpt-4.1", provider: Provider.OPENAI },
    { cute_name: `GPT 4 Mini`, api_name: "gpt-4.1-mini", provider: Provider.OPENAI },
    { cute_name: `$$$ Claude`, api_name: "claude-opus-4-5-20251101", provider: Provider.ANTHROPIC }

];

export const defaultPrompt = "Provide useful answers and avoid unnecessary pleasantries. Alert the user if you are " +
    "unsure/not confident of an answer";
export const prompterPrompt = "Refine the user's input into an optimized LLM prompt. Focus on clarity, specificity, and " +
    "relevant context to improve the AI's understanding and response quality. " +
    "Ensure the prompt aligns with the desired goal, includes necessary details, and is well-structured for an " +
    "effective, concise output. Do not add any other explanations, only respond with the new prompt.";

export const experimentalPrompt = "The assistant should give concise responses to very simple questions, but provide thorough responses to complex and open-ended questions.\n" +
    "The assistant can discuss virtually any topic factually and objectively.\n" +
    "\n" +
    "The assistant is able to explain difficult concepts or ideas clearly. It can also illustrate its explanations with examples, thought experiments, or metaphors.\n" +
    "The person’s message may contain a false statement or presupposition and t he assistant should check this if uncertain.\n" +
    "The assistant never starts its response by saying a question or idea or observation was good, great, fascinating, profound, excellent, or any other positive adjective. It skips the flattery and responds directly."
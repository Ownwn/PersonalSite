async function* fetchSSE(response: Response) {
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") return;
                try {
                    yield JSON.parse(data);
                } catch (e) {
                }
            }
        }
    }
}

export class Provider {
    static ofOpenai(): Provider {
        return new Provider(chunk => {
            if (chunk.delta) {
                return chunk.delta;
            } else if (chunk.type && chunk.type.includes("reasoning_summary_text.done")) {
                return "\n# End Reasoning Answer\n";
            }
            return null;
        }, async (env, question, model, system, history, reasoning, cache) => {

            const input = appendHistory(question, history)

            const response = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${env.OPENAI_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    input,
                    instructions: system,
                    max_output_tokens: 8192,
                    stream: true,
                    ...(reasoning ? { reasoning: { effort: "medium", summary: "auto" } } : {}),
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `OpenAI Error ${response.status}: ${(await response.text()).substring(0, 200)}`
                );
            }

            return fetchSSE(response);
        });
    }

    static ofClaude(url: string, keyName: string): Provider {
        return new Provider(chunk => {
            if (chunk.type === 'content_block_delta' && (chunk.delta.type === 'text_delta' || chunk.delta.type === 'thinking_delta')) {
                return chunk.delta.text || chunk.delta.thinking;
            }
            if (chunk.type === 'content_block_start' && chunk.content_block && chunk.content_block.type === 'text') {
                return "\n# End Reasoning Answer\n";
            }
            return null
        }, async (env, question, model, system, history, reasoning, cache) => {

            const input = appendHistory(question, history)

            // @ts-ignore
            const body = {
                messages: input,
                stream: true,
                model: model,
                max_tokens: 8096,
                cache_control: (cache ? { type: "ephemeral" } : undefined),
                system: system,
                thinking: (reasoning ? {
                    type: "adaptive",
                    display: "summarized"
                } : undefined)

            }

            console.log(body)
            console.log(keyName)


            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "x-api-key": env[keyName],
                    "content-type": "application/json",
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Anthropic Error ${response.status}: ${(await response.text()).substring(0, 200)}`);

            }

            return fetchSSE(response);

        });
    }




    private constructor(public getText: (chunk: any) => string | null, public buildStream: (env: any, question: string, model: string, system: string, history: object[], reasoning: boolean | undefined, cache: boolean | undefined) => Promise<any>) {}
}

export function appendHistory(question, history: object[]): object[] {
    const input = []
    for (let i = 0; i < history.length; i++) {
        const historyChunk = history[i]
        // @ts-ignore
        input.push({"role": "user", "content": historyChunk.question})
        // @ts-ignore
        input.push({"role": "assistant", "content": historyChunk.response})
    }
    input.push({"role": "user", "content": question})
    return input
}

export const models = [
    { cute_name: `GPT 5.4`, api_name: "gpt-5.4-2026-03-05", provider: Provider.ofOpenai()},
    { cute_name: `GPT 4 Mini`, api_name: "gpt-4.1-mini", provider: Provider.ofOpenai(), reasoning: false },
    { cute_name: `$$$ Claude`, api_name: "claude-opus-4-6", provider: Provider.ofClaude("https://api.anthropic.com/v1/messages", "CLAUDE_KEY")},
    { cute_name: `Deepseek`, api_name: "deepseek-v4-pro", provider: Provider.ofClaude("https://api.deepseek.com/anthropic/v1/messages", "DEEPSEEK_KEY")}

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
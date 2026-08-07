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
                } catch (e) { /* empty */ }
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
        }, async (env, question, model, system, history, reasoning, options) => {

            const input = appendHistory(question, history)

            // @ts-ignore
            const extraTokenLimit = options && options.extraTokens

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
                    max_output_tokens: extraTokenLimit ? 50_000 : 8192,
                    stream: true,
                    ...(reasoning ? { reasoning: { effort: "high", summary: "auto" } } : {}),
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
        }, async (env, question, model, system, history, reasoning, options) => {

            const input = appendHistory(question, history)

            // @ts-ignore
            const extraTokenLimit = options && options.extraTokens

            // @ts-ignore
            const body = {
                messages: input,
                stream: true,
                model: model,
                max_tokens: (keyName === "DEEPSEEK_KEY" || extraTokenLimit) ? 50_000 : 8192,
                system: system,
                thinking: (reasoning ? {
                    type: "adaptive",
                    display: "summarized"
                } : undefined)

            }



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




    private constructor(public getText: (chunk: any) => string | null, public buildStream: (env: any, question: string, model: string, system: string, history: object[], reasoning: boolean | undefined, options: object | undefined) => Promise<any>) {}
}

// @ts-ignore
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
    { cute_name: `GPTlunar`, api_name: "gpt-5.6-terra", provider: Provider.ofOpenai()},
    { cute_name: `GPTsol`, api_name: "gpt-5.6-sol", provider: Provider.ofOpenai()},
    { cute_name: `WALLET`, api_name: "claude-fable-5", provider: Provider.ofClaude("https://api.anthropic.com/v1/messages", "CLAUDE_KEY")},
    { cute_name: `Deepseek`, api_name: "deepseek-v4-pro", provider: Provider.ofClaude("https://api.deepseek.com/anthropic/v1/messages", "DEEPSEEK_KEY")}

];

export const newPromptAug2026 = "Provide useful answers and avoid unnecessary pleasantries. If you encounter any strong ambiguities, ask the user for clarification";
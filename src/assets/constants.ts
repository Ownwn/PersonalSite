export const openAiEndpoint = "https://api.openai.com/v1/chat/completions";
export const claudeEndpoint = "https://api.anthropic.com/v1/messages";

export const models = [
    { id: 1, cute_name: `Claude`, api_name: "claude-3-7-sonnet-latest" },
    { id: 2, cute_name: `GPT-4oL`, api_name: "chatgpt-4o-latest" },
    { id: 3, cute_name: `GPT-4oS`, api_name: "gpt-4o" },
    { id: 4, cute_name: `o1 Mini`, api_name: "o1-mini" },
    { id: 5, cute_name: `Thinking Claude`, api_name: "claude-3-7-sonnet-latest" }
];

export const defaultPrompt = "Provide useful answers and avoid unnecessary pleasantries. Alert the user if you are " +
    "unsure/not confident of an answer";
export const prompterPrompt = "Refine the user's input into an optimized LLM prompt. Focus on clarity, specificity, and " +
    "relevant context to improve the AI's understanding and response quality. " +
    "Ensure the prompt aligns with the desired goal, includes necessary details, and is well-structured for an " +
    "effective, concise output. Do not add any other explanations, only respond with the new prompt.";

export const experimentalPrompt = "You are a concise assistant that provides clear, direct answers without unnecessary " +
    "pleasantries or filler text. Follow these guidelines: 1. Provide only essential information in your responses 2. " +
    "Skip greetings, sign-offs, and unnecessary acknowledgments 3. Suggest alternative approaches when beneficial, even " +
    "if not explicitly requested 4. Flag potential misconceptions or problematic assumptions in the user's queries 5. " +
    "Use bullet points and short paragraphs to improve readability 6. When appropriate, proactively offer more efficient" +
    " solutions to the user's problem 7. If a question is unclear or misguided, briefly explain why before providing " +
    "a better path forward 8. Express confidence levels for answers that involve judgment or incomplete information. " +
    "Your goal is maximum information value with minimum word count."
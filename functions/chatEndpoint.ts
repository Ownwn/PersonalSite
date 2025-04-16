import { claudeEndpoint, models, openAiEndpoint } from "../src/assets/constants";
//import {EventContext} from "@cloudflare/workers-types"





export async function onRequestPost(context: EventContext<any, any, any>) {
    const error = genErrorResponse("Error: Invalid Question", 400);


    let userData;

    try {
        userData = await context.request.json();
    } catch (e) {
        return error
    }


    if (!userData.question || !userData.model_id) {
        return error;
    }


    const messages = [
        { role: "user", content: userData.question }
    ];

    if (userData.model_id < 1 || userData.model_id > models.length) {
        return error;
    }


    const isStandardClaude = userData.model_id == 1;
    const isThinkingClaude = userData.model_id == 2;


    const requestBody: any = {
        model: models[userData.model_id - 1].api_name,
        messages: messages
    };


    let headers;
    if (isStandardClaude || isThinkingClaude) {


        if (isThinkingClaude) {

            requestBody.max_tokens = 24000;

            requestBody.thinking = {
                type: "enabled",
                budget_tokens: 16000
            };
        } else {
            requestBody.max_tokens = 4096;
            requestBody.system = userData.system_prompt;
        }

        headers = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "x-api-key": context.env.CLAUDE_KEY
        };
    } else {
        requestBody.messages.push({ role: "system", content: userData.system_prompt });

        headers = {
            "Content-Type": "application/json",
            "Authorization": context.env.OPENAI_KEY
        };
    }

    const endpoint = isStandardClaude || isThinkingClaude ? claudeEndpoint : openAiEndpoint;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    const json: any = await response.json();


    if (!response.ok) {
        console.log(json);

        return genErrorResponse("Error interacting with OpenAI API.", response.status);
    }

    const goodJson = {answer: ""}

    if (isStandardClaude) {
        goodJson.answer = json.content[0].text;
    } else if (isThinkingClaude) {
        goodJson.answer = json.content[0].thinking + "**\n\n--- END REASONING BLOCK ---\n\n**" + json.content[1].text;
    } else {
        goodJson.answer = json.choices[0].message.content;
    }

    return new Response(JSON.stringify(goodJson), {
        headers: { "Content-Type": "application/json" }
    });


    function genErrorResponse(message: string, statusCode: number) {
        return new Response(JSON.stringify({ message: message }), {
            headers: { "Content-Type": 'application/json' },
            status: statusCode,
        });
    }
}
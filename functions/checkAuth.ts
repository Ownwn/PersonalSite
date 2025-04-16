// @ts-ignore
export async function onRequestPost(context: EventContext) {
    await sleep(1000 + Math.random() * 2000) // good enough

    try {
        const request: Request = context.request;
        const requestJson: object = await request.json();

        if (checkPassword(requestJson, context)) {
            return response(true, context.env.COOKIE_VALUE);
        }

    } catch (_error) { /* ignore parsing fail, will return bad response anyway */
    }

    return response(false, undefined)
}

function response(success: boolean, newCookie: string): Response {
    const responseJson = {};
    responseJson["success"] = success;

    if (newCookie) {
        responseJson["set_cookie"] = true;
        responseJson["cookie"] = newCookie;
    }

    return new Response(JSON.stringify(responseJson), {
        status: success ? 200 : 401,
        headers: {
            "Content-Type": "application/json"
        }
    });
}

// @ts-ignore
function checkPassword(json: object, context: EventContext) {
    const password = json["password"];
    return password && password === context.env.USER_PASSWORD;
}

function sleep(time: number) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, time));
}
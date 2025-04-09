// @ts-ignore
export async function onRequestPost(context: EventContext) {

    try {
        const request: Request = context.request;
        const requestJson = await request.json();
        console.log(requestJson)

        if (checkPassword(requestJson)) {
            console.log("in check pwd!")
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


function checkPassword(json) {
    const password = json["password"];
    return password && password === "pass";
}

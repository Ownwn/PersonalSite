export async function onRequestPost(context: EventContext<any, any, any>) {
    await sleep(1000 + Math.random() * 2000); // good enough

    try {
        const request: Request = context.request;
        const requestJson: object = await request.json();

        if (checkPassword(requestJson, context)) {
            return new Response(null, {
                status: 200,
                headers: {
                    "Set-Cookie": `auth_cookie=${context.env.COOKIE_VALUE}; Max-Age=${30 * 24 * 60 * 60}; Path=/;`
                }
            });
        }

    } catch (_error) { /* ignore parsing fail, will return bad response anyway */
    }

    return new Response(null, {
        status: 401
    });
}

function checkPassword(json: object, context: EventContext<any, any, any>) {
    const password = json["password"];
    return password && password === context.env.USER_PASSWORD;
}

function sleep(time: number) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, time));
}
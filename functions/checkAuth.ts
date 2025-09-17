import bcrypt from "bcryptjs"

export async function onRequestPost(context: EventContext<any, any, any>) {
    await sleep(1000 + Math.random() * 2000); // good enough

    try {
        const request: Request = context.request;
        const requestJson: object = await request.json();

        // i love javascript truthy values, Promise<Boolean> == true
        if (await checkPassword(requestJson, context) === true) {
            return new Response(null, {
                status: 200,
                headers: {
                    "Set-Cookie": `auth_cookie=${context.env.COOKIE_VALUE}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=None; Secure;`
                }
            });
        }

    } catch (_error) { /* ignore parsing fail, will return bad response anyway */
    }

    return new Response(null, {
        status: 401
    });
}

async function checkPassword(json: object, context: EventContext<any, any, any>) {
    const password = json["password"];
    if (!password) {
        return false;
    }
    return (await bcrypt.compare(password, context.env.USER_HASH)) || (await bcrypt.compare(password, context.env.GUEST_HASH))
}

function sleep(time: number) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, time));
}
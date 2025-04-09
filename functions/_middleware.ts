const baseURL = "http://127.0.0.1:8788/";
const authURL = "http://127.0.0.1:8788/auth";
const authURL2 = "http://127.0.0.1:8788/checkAuth";
const assetsURL = "http://127.0.0.1:8788/assets/";

// @ts-ignore
export async function onRequest(context: EventContext) {
    if (isFreeUrl(context) || checkCookie(context)) {
        return await context.next();
    }
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/auth"
        }
    });

}

// @ts-ignore
function isFreeUrl(context: EventContext): boolean {
    const url = context.request.url;
    if (!url) {
        return false;
    }

    return url === baseURL || url === authURL|| url === authURL2 || url.startsWith(assetsURL)

}

// @ts-ignore
function checkCookie(context: EventContext): boolean {
    const cookies = context.request.headers.get("cookie");
    if (!cookies || cookies.length > 200) {
        return false;
    }

    for (const cookie of cookies.split(";")) {
        const [name, value] = cookie.trim().split("=");
        if (name === "auth_cookie" && value === context.env.COOKIE_VALUE) {
            return true;
        }
    }

    return false;
}
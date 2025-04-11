const baseUrl = "https://personalsite-29o.pages.dev"; // todo add main domain
const baseUrlLocal = "http://127.0.0.1:8788";
const authEndpoint = "auth";
const checkAuthEndpoint = "checkAuth";
const assetsEndpoint = "assets/";

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
    const url = validateUrl(context.request.url);
    if (url === undefined) {
        return false;
    }


    return url === "" || url === authEndpoint || url === checkAuthEndpoint || url === "bean" || url.startsWith(assetsEndpoint);
}

function validateUrl(url) {
    if (!url) {
        return undefined;
    }

    if (url.startsWith(baseUrl)) {
        url = url.replace(baseUrl, "");
    } else if (url.startsWith(baseUrlLocal)) {
        url = url.replace(baseUrlLocal, "");
    }

    if (url.endsWith("/")) {
        url = url.substring(0, url.length - 1);
    }
    if (url.startsWith("/")) {
        url = url.substring(1, url.length);
    }

    if (url !== null && url !== undefined) {
        return url;
    }
    return undefined;
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
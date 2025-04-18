const baseUrl = "https://personalsite-29o.pages.dev";
const baseUrlDns = "https://ownwn.com";
const baseUrlLocal = "http://127.0.0.1:8788";
const assetsEndpoint = "assets/";

const freeEndpoints = ["robots.txt", "auth", "checkAuth", "404", "favicon.ico"]

export async function onRequest(context: EventContext<any, any, any>) {
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

function isFreeUrl(context: EventContext<any, any, any>): boolean {
    const url = validateUrl(context.request.url);
    if (url === undefined) {
        return false;
    }
    return freeEndpoints.indexOf(url) !== -1 || url.startsWith(assetsEndpoint)
}

function validateUrl(url: string) {
    if (!url) {
        return undefined;
    }

    if (url.startsWith(baseUrl)) {
        url = url.replace(baseUrl, "");
    } else if (url.startsWith(baseUrlLocal)) {
        url = url.replace(baseUrlLocal, "");
    } else if (url.startsWith(baseUrlDns)) {
        url = url.replace(baseUrlDns, "")
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

function checkCookie(context: EventContext<any, any, any>): boolean {
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
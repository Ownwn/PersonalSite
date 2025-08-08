const assetsEndpoint = "assets/";

const freeEndpoints = ["robots.txt", "auth", "checkAuth", "404", "favicon.ico"];

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
    return freeEndpoints.indexOf(url) !== -1 || url.startsWith(assetsEndpoint);
}

function validateUrl(url: string) {
    if (!url) {
        return undefined;
    }

    let endpoint = new URL(url).pathname;

    if (endpoint.endsWith("/")) {
        endpoint = endpoint.substring(0, endpoint.length - 1);
    }
    if (endpoint.startsWith("/")) {
        endpoint = endpoint.substring(1, endpoint.length);
    }

    if (endpoint !== null && endpoint !== undefined) {
        return endpoint;
    }
    return undefined;
}

function checkCookie(context: EventContext<any, any, any>): boolean {
    const cookies = context.request.headers.get("cookie");
    if (!cookies) {
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
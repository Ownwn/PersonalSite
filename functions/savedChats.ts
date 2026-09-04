import {genResponse} from "./404";

export async function onRequestGet(context: EventContext<any, any, any>) {
    let res;
    try {
        res = await context.env.CHATS.prepare("select * from conversations").run()
        if (!res.success) console.error("res is: ", res)
    } catch (error) {
        console.error(error)
        return genResponse("error fetching from db", 500)
    }


    return new Response(JSON.stringify(res.results), {
        headers: {"Content-Type": "application/json"},
        status: 200
    });
}


export async function onRequestPost(context: EventContext<any, any, any>) {
    let userData;

    try {
        userData = await context.request.json();
        const title: string = userData.title;
        const body: object = userData.body;
        const id: string = userData.id;

        const updatedTime = Date.now()
        if (!title || !body || !id) {
            console.error("missing title or body or uuid. (title, body, uuid): ", title, body, id)
            return genResponse("missing title or body or id", 400)
        }

        const res = await context.env.CHATS.prepare(
            "insert into conversations (id, title, created_at, body, updated_at) values (?, ?, ?, ?, ?) on conflict(id) do update set title = excluded.title, body = excluded.body, updated_at = excluded.updated_at")
            .bind(id, title, updatedTime, JSON.stringify(body), updatedTime)
            .run()


    } catch (e) {
        console.error(e)
        return genResponse("unknown error " + e.message, 500)
    }


    return new Response("and posted!!", {
        headers: {"Content-Type": "text/plain"},
        status: 200
    });
}

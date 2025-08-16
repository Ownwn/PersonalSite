export async function onRequestPost(context: EventContext<any, any, any>) {
    const text = await context.request.text();
    if (!text) {
        return new Response("Bad Data", {status: 400});
    }

    try {
        await context.env.DB.prepare(
            "INSERT INTO data (content, created_at) values (?, ?)",
            )
            .bind(text, Date.now())
            .run();

    } catch (error) {
        return new Response("Error inserting into database", {status: 500});
    }

    return new Response("Data submitted!");
}
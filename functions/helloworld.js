export async function onRequest(context) {
    let b = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    let c = await b.json()
    return new Response(JSON.stringify(c))
}
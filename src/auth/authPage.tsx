// @ts-ignore
import Cookies from "js-cookie";

export function AuthPage() {

    // @ts-ignore
    async function sendPassword(formData: any) {

        const res = await fetch("checkAuth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(Object.fromEntries(formData))
        })

        const json = await res.json()
        const cookie = json["cookie"]
        if (cookie) {
            Cookies.set("auth_cookie", cookie)
        }

        console.log("json is", json) // todo cleanup

    }

    // @ts-ignore
    async function setCookie() {

    }

    return <>
        <p>nope, but:</p>

        <form action={sendPassword}>
            <button type="submit">Submit me</button>
            <input type="password" required name="password"/>
        </form>

        {/*<button onClick={() => Cookies.set('auth', 'password', { expires: 7, path: '/' })}>click to set!</button>*/}
    </>
}
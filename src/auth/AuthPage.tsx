// @ts-ignore
import Cookies from "js-cookie";

export function AuthError() {

    // @ts-ignore
    async function sendPassword(formData: any) {

        const res = await fetch("checkAuth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"password": "pass"})
        })

        const json = await res.json()
        const cookie = json["cookie"]
        Cookies.set("auth_cookie", cookie)
        console.log("json is", json) // todo cleanup

    }

    // @ts-ignore
    async function setCookie() {

    }

    return <>
        <p>nope, but:</p>

        <form action={sendPassword}>
            <button type="submit">Submit me</button>
            <input type="hidden" name="productId" value="cool product bro" />
            <input type="hidden" name="password" value="pass" />
        </form>

        {/*<button onClick={() => Cookies.set('auth', 'password', { expires: 7, path: '/' })}>click to set!</button>*/}
    </>
}
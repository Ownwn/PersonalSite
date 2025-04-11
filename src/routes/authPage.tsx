import Cookies from "js-cookie";
import {useState} from "react";

export function AuthPage() {
    const [response, setResponse] = useState("");

    return <>
        <p>nope, but:</p>

        <form action={sendPassword}>
            <button type="submit">Submit me</button>
            <input type="password" required name="password"/>
        </form>

        <p>and the response is! {response}</p>

    </>;



    async function sendPassword(formData: any) {

        const res = await fetch("checkAuth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        const json = await res.json();

        setCookie(json["cookie"]);

    }


    function setCookie(cookie: string) {
        if (!cookie) {
            setResponse("Fail");
            return;
        }
        Cookies.set("auth_cookie", cookie, { expires: 30, path: "/" });

        setResponse("Cookie set!");
    }


}
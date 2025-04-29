import {useState} from "react";
import {useFormStatus} from "react-dom";

export function AuthPage() {
    const [response, setResponse] = useState("");

    return <>
        <br/>
        <br/>
        <div className="center">
            <h2>Login is required!</h2>
            <p>This page is only really used by me.</p>
            <p> If you want to contact me, you can email me at owen @ this domain</p>
            <a href="https://github.com/Ownwn">Github</a>
            <br/>
            <br/>

            <form action={sendPassword}>
                <PasswordForm/>
            </form>
        </div>

    </>;

    function PasswordForm() {
        const status = useFormStatus();
        return (
            <>
                <button type="submit">Submit</button>
                <input type="password" required name="password" placeholder="Password"/>
                <p>{status.pending ? "Loading.." : response}</p>
            </>
        );
    }


    async function sendPassword(formData: any) {
        setResponse("Loading...");

        const res = await fetch("checkAuth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        setResponse(res.ok ? "Cookie set!" : "Fail");

    }
}
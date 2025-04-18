import { useState } from "react";
import { useFormStatus } from "react-dom";

export function AuthPage() {
    const [response, setResponse] = useState("");

    return <>
        <p>nope, but:</p>

        <form action={sendPassword}>
            <PasswordForm/>
        </form>

    </>;

    function PasswordForm() {
        const status = useFormStatus();
        return (
            <>
                <button type="submit">Submit me</button>
                <input type="password" required name="password"/>
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

        setResponse(res.ok ? "Cookie set!" : "Fail")

    }
}
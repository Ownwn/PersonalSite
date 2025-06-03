import {useState} from "react";
import {useFormStatus} from "react-dom";
import styles from "./authPage.module.css";

export function AuthPage() {
    const [response, setResponse] = useState("");
    const [passwordVisibility, setPasswordVisibility] = useState("text");

    return <div className={styles.homeBackground}>
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
                <PasswordForm passwordType={passwordVisibility} togglePasswordVis={togglePasswordVis}
                              response={response}/>
            </form>
        </div>

    </div>;


    function togglePasswordVis() {
        if (passwordVisibility === "text") {
            setPasswordVisibility("password");
        } else {
            setPasswordVisibility("text");
        }
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

// @ts-ignore
function PasswordForm({ passwordType, togglePasswordVis, response }) {
    const status = useFormStatus();
    return (
        <>
            <button type="submit">Submit</button>

            <input type={passwordType} required name="password" placeholder="Password"/>
            <button type="button" onClick={togglePasswordVis}>Reveal 👁️</button>

            <p>{status.pending ? "Loading.." : response}</p>

        </>
    );
}
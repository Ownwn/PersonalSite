import {useState} from "react";
import {useFormStatus} from "react-dom";
import styles from "./authPage.module.css";

export function AuthPage() {
    const [response, setResponse] = useState("");
    const [passwordVisibility, setPasswordVisibility] = useState("password");

    return <div className={styles.homeBackground}>
        <br/>
        <br/>
        <div className={styles.cent}>
            <div className={styles.innerHeader}>
                <h1 className={styles.header}>Login is required!</h1>
                <p>This page is only really used by me.</p>
                <p> If you want to contact me, you can email me at owen @ this domain</p>

                <br/>
                <a className={styles.githubLinkWrapper} href="https://github.com/Ownwn">
                    <span className={styles.githubLink}>My Github</span>
                    <span className={styles.githubLinkEmoji}> 🔗</span>
                </a>
            </div>

            <br/>
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

        setResponse(res.ok ? "Success!" : "Authentication failed.");

    }
}

// @ts-ignore
function PasswordForm({passwordType, togglePasswordVis, response}) {
    const status = useFormStatus();
    return (
        <>

            <div className={styles.passwordRow}>
                <input
                    className={styles.passwordBox}
                    type={passwordType}
                    required
                    name="password"
                    placeholder="Password"
                />
                <span className={styles.eye} onClick={togglePasswordVis}>👁️</span>
            </div>

            <button className={styles.button + " " + styles.submitButton} type="submit">Submit</button>

            <p className={styles.response}>{status.pending ? "Loading.." : response}</p>

        </>
    );
}

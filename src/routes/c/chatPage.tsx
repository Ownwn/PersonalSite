import {FormEvent, useEffect, useState} from "react";

import styles from "./chatPage.module.css";
import Cookies from "js-cookie";


import {defaultPrompt, experimentalPrompt, models, prompterPrompt} from "../../assets/constants.ts";


export function ChatPage() {

    const [botResponse, setBotResponse] = useState("");
    const [question, setQuestion] = useState("");
    const [model, setModel] = useState(String(0));
    const [system, setSystem] = useState(experimentalPrompt);

    const [promptStuff, setPromptStuff] = useState(false);

    useEffect(() => {
        const preferredSystem = Cookies.get("preferred_system");
        if (preferredSystem === undefined) {
            return;
        }

        setSystem(preferredSystem);
    }, []);


    return (
        <div className={styles.chatBackground}>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>

            <div className={styles.cent}>
                <form onSubmit={handleSubmit}>
                    <button className={styles.submitButton} type="submit">Submit</button>
                    <br/>
                    <textarea onChange={e => setQuestion(e.target.value)} value={question} name={"question"}
                              placeholder="Question" className={styles.question} required/>
                    <br/>

                    <div className={styles.cent2}>
                        <div className={styles.checkboxGroup}>

                            <ModelSelector/>

                            <button type="button" className={styles.promptButton}
                                    onClick={() => setPromptStuff(!promptStuff)}>Toggle
                            </button>

                            <PromptTools/>


                            <br/>
                        </div>
                    </div>
                    <textarea onChange={e => setSystem(e.target.value)} value={system} name={"system"} rows={4}
                              cols={50} placeholder="System" className={styles.system}/>

                </form>


                <br/>
                <ResponseBox/>
            </div>

        </div>
    );

    function ModelSelector() {
        return <>
            <select value={model} name="model" onChange={e => setModel(e.target.value)}>
                {models.map((m, index) => (
                    <option value={index} key={index}>{m.cute_name}</option>
                ))}

            </select>

        </>;
    }

    function FormattedResponse() {
        const properResponse = [];
        const boldRegex = RegExp("\\*\\*([^*]+)\\*\\*");

        let key = 0;
        let isCodeLine = false;
        for (let line of botResponse.split("\n")) {

            if (line.startsWith("```")) {
                isCodeLine = !isCodeLine;

                key++;
                continue;
            }

            if (isCodeLine) {
                properResponse.push(<><span className={styles.codeResponse}>{line}</span><br/></>);

                key++;
                continue;
            }

            let headerCount = 0;
            while (line.startsWith("#")) {
                line = line.substring(1, line.length);
                headerCount++;
            }

            if (boldRegex.test(line)) {
                // @ts-ignore
                line = getBoldLine(line); // changing types - probably bad but whatever
            }

            if (headerCount > 0) {
                // @ts-ignore
                line = getHeaderLine(line, headerCount, key);
            }


            properResponse.push(<div>{line}</div>);


            key++;
        }
        return properResponse;
    }

    function getHeaderLine(line: string, headerCount: number, key: number) {
        let newLine;
        switch (headerCount) {
            case 1:
                newLine = <h2 key={key}>{line}</h2>;
                break;
            case 2:
                newLine = <h3 key={key}>{line}</h3>;
                break;
            case 3:
                newLine = <h4 key={key}>{line}</h4>;
                break;
            default:
                newLine = <span key={key}>{line}</span>;
                break;
        }
        return newLine;
    }

    function getBoldLine(line: string) {
        const lineChunks = line.split("**");

        const formattedChunks = [];
        for (let i = 0; i < lineChunks.length; i++) {
            if (i % 2 == 0) {
                formattedChunks.push(<span key={i}>{lineChunks[i]}</span>);
            } else {
                formattedChunks.push(<strong key={i}>{lineChunks[i]}</strong>);
            }
        }

        return <>{formattedChunks}</>;
    }


    function ResponseBox() {
        if (!botResponse) {
            return <></>;
        }
        return <div className={styles.responseBox}>
            <div className={styles.response}>{FormattedResponse()}</div>
        </div>;
    }

    function PromptTools() {
        if (promptStuff) {
            return <>
                <button type="button" className={styles.promptButton} onClick={resetSystem}>Default</button>
                <button type="button" className={styles.promptButton} onClick={experimentalSystem}>Experimental</button>
                <button type="button" className={styles.promptButton} onClick={promptSystem}>Prompter</button>
                <button type="button" className={styles.promptButton} onClick={usePrompt}>Use</button>
                <button type="button" className={styles.promptButton} onClick={savePrompt}>Save</button>
            </>;
        }

        return <></>;
    }

    function resetSystem() {
        setSystem(defaultPrompt);
    }

    function experimentalSystem() {
        setSystem(experimentalPrompt);
    }

    function promptSystem() {
        setSystem(prompterPrompt);
    }

    function usePrompt() {
        setQuestion(botResponse);
        resetSystem();
    }

    function savePrompt() {
        Cookies.set("preferred_system", system, {expires: 90});
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setBotResponse("Loading...");
        await submitPrompt();
    }


    async function submitPrompt() {
        const request = {
            question: question,
            model_id: model,
            system_prompt: system
        };

        const response = await fetch("chatEndpoint", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        if (!response.body || !response.ok) {
            setBotResponse("Failed " + String(response.status));
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let res = "";

        setBotResponse("");


        try {
            while (true) {
                const {done, value} = await reader.read();
                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, {stream: true});
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed) {
                                setBotResponse(prev => prev + parsed);
                                res += parsed;
                            }
                        } catch (ignored) {
                        }
                    } else if (line.trim() !== '') {
                        console.log("Unexpected line:", line);
                    }
                }
            }

            if (buffer.trim() && buffer.startsWith('data: ')) {
                const data = buffer.slice(6);
                if (data !== '[DONE]') {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed) {
                            setBotResponse(prev => prev + parsed);
                            res += parsed;
                        }
                    } catch (ignored) {
                        console.log("Error parsing buffer", data);
                    }
                }
            }
        } finally {
            reader.releaseLock();
            console.log(res);
            console.log("\n\n\n");
        }
    }
}
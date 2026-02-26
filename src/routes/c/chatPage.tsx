import {FormEvent, useEffect, useState} from "react";

import styles from "./chatPage.module.css";
import Cookies from "js-cookie";


import {defaultPrompt, experimentalPrompt, models, prompterPrompt} from "../../assets/constants.ts";

type HistoryChunk = {question: string, response: string, hidden: boolean}

export function ChatPage() {

    const [botResponse, setBotResponse] = useState("");
    const [question, setQuestion] = useState("");
    const [model, setModel] = useState(String(0));
    const [system, setSystem] = useState(experimentalPrompt);
    const [legacy, setLegacy] = useState(false)

    const [history, setHistory] = useState<HistoryChunk[]>([
        // {question: "Test question", response: "Example response.\nfoo bar..", hidden: false}, {question: "Second test", response: "Another res.\nokay.\nnext", hidden: false}
    ])
    const [historyEnabled, setHistoryEnabled] = useState(true)

    const [promptStuff, setPromptStuff] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState("")

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

                            <button type="button" className={styles.promptButton}
                                    onClick={() => setLegacy(old => !old)}>Legacy: {legacy ? "On" : "Off"}
                            </button>

                            <button type="button" className={styles.promptButton}
                                    onClick={() => setHistoryEnabled(old => !old)}>History: {historyEnabled ? "On" : "Off"}
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

    function toggleHistoryButton(index: number)  {
        return <button type={"button"} className={styles.hideButton} onClick={() => {

            setHistory(prev => prev.map(
                (chunk, chunkIndex) => (
                    {question: chunk.question, response: chunk.response, hidden: (index===chunkIndex ? !chunk.hidden : chunk.hidden)}
                )))
        }}>
            <b style={{backgroundColor: (history[index].hidden ? "rgba(255,34,34,0.51)" : "rgba(34,34,255,0.51)")}}>{history[index].hidden ? "❌" : "✓"}</b>

        </button>
    }

    // trueHistory is if the user can delete it
    function FormattedResponse(historyIndex: number, historyPiece: HistoryChunk, trueHistory: boolean) {
        const properResponse = [];
        const boldRegex = RegExp("\\*\\*([^*]+)\\*\\*");

        let key = 0;
        let isCodeLine = false;

        properResponse.push(
            <div className={styles.questionHeader}>
                <span>
                    <span className={styles.together}>
                        {!trueHistory ? <></> : toggleHistoryButton(historyIndex)}
                        {historyPiece.hidden ? <s>
                            {getHeaderLine(historyPiece.question, 1, 9999)}
                        </s> : <>
                            {getHeaderLine(historyPiece.question, 1, 9999)}</>}
                    </span>
                </span>


            </div>
        )

        for (let line of historyPiece.response.split("\n")) {

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


            properResponse.push(<div>{!historyPiece.hidden ? line : <s>{line}</s>}</div>);


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
        if (!botResponse && history.length === 0) {
            return <></>;
        }

        const responses = []

        console.log(history.length)
        for (let i = 0; i < history.length; i++) {
            responses.push(<div className={styles.response} key={i+1}>{FormattedResponse(i, history[i], true)}</div>)
        }

        if (pendingQuestion !== "" && botResponse !== "") {
            responses.push(
                <div className={styles.response} key={history.length+2}>
                    {FormattedResponse(-1, {question: pendingQuestion, response: botResponse, hidden: false}, false)}
                </div>
            )
        }


        return <div className={styles.responseBox}>
            {responses}
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
        setPendingQuestion(question)
        await submitPrompt();
    }


    async function submitPrompt() {
        if (!historyEnabled) {
            setHistory([])
        }

        const request = {
            question: question,
            model_id: model,
            system_prompt: system,
            history: history.filter(h => !h.hidden)
        };

        const response = await fetch(legacy ? "legacyChat" : "chatEndpoint", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        if (!response.body || !response.ok) {
            setBotResponse("Failed " + String(response.status) + " " + String(await response.text()));
            return;
        }
        const oldQuestion = question

        if (legacy) {
            try {
                const legacyRes = await response.json()
                setHistory(old => [...old, {question: oldQuestion, response: legacyRes, hidden: false}])
                setBotResponse(legacyRes)
                setBotResponse("")
                console.log("Legacy User: ", oldQuestion);
                console.log("\n")
                console.log("Legacy Res: ", legacyRes);
                console.log("\n\n\n");
            } catch (e) {
                setBotResponse("Failed " + e)
            }
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
                        } catch (e) {
                            console.error("Parsing error with ", data, " Error is ", e)
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
            console.log("User: ", oldQuestion);
            console.log("\n")
            console.log("Res: ", res);
            console.log("\n\n\n");
            setHistory(old => [...old, {question: oldQuestion, response: res, hidden: false}])
            setBotResponse("")

        }
    }
}
import { FormEvent, useState } from "react";

import styles from "./chatPage.module.css";


import { defaultPrompt, experimentalPrompt, models, prompterPrompt } from "../../assets/constants.ts";


export function ChatPage() {

    const [botResponse, setBotResponse] = useState("");
    const [question, setQuestion] = useState("");
    const [model, setModel] = useState(String(models[0].id));
    const [system, setSystem] = useState(experimentalPrompt);

    const [promptStuff, setPromptStuff] = useState(false);


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
                {models.map(m => (
                    <option value={m.id} key={m.id}>{m.cute_name}</option>
                ))}

            </select>

        </>;
    }

    function FormattedResponse() {
        const properResponse = [];
        const boldRegex = RegExp("\\*\\*([^*]+)\\*\\*")

        let key = 0;
        for (let line of botResponse.split("\n")) {
            let headerCount = 0;
            while (line.startsWith("#")) {
                line = line.substring(1, line.length);
                headerCount++;
            }

            let isBold = false

            if (boldRegex.test(line)) {
                // @ts-ignore
                line = getBoldLine(line) // changing types - probably bad but whatever

                isBold = true;
            }


            switch (headerCount) {
                case 1: properResponse.push(<h2 key={key}>{line}</h2>); break;
                case 2: properResponse.push(<h3 key={key}>{line}</h3>); break;
                case 3: properResponse.push(<h4 key={key}>{line}</h4>); break;
                default: {
                    if (isBold) {
                        properResponse.push(<div key={key}>{line}</div>);
                    } else {
                        properResponse.push(<span key={key}>{line}</span>);
                    }
                    break;
                }
            }


            key++;
        }
        return properResponse;
    }

    function getBoldLine(line: string) {
        const lineChunks = line.split("**")

        const formattedChunks = []
        for (let i = 0; i < lineChunks.length; i++) {
            if (i % 2 ==0) {
                formattedChunks.push(<span key={i}>{lineChunks[i]}</span>)
            } else {
                formattedChunks.push(<strong key={i}>{lineChunks[i]}</strong>)
            }
        }

        return <>{formattedChunks}</>
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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setBotResponse("Loading..");
        setBotResponse(await submitPrompt());
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

        if (!response.ok) {
            return "# Main Header\n" +
                "\n" +
                "This is some normal text that flows after the main header.\n" +
                "\n" +
                "## Section 1\n" +
                "\n" +
                "Here's a paragraph with **bold text** embedded within normal text. The bold text stands out from the rest.\n" +
                "\n" +
                "### Subsection 1.1\n" +
                "\n" +
                "Normal text continues in this subsection. **Multiple bold words** can appear anywhere in the text.\n" +
                "\n" +
                "## Section 2\n" +
                "\n" +
                "This section **contains** more **bold formatting** for testing purposes.\n" +
                "\n" +
                "# Another Main Header\n" +
                "\n" +
                "Some final text under the second main header with a **bold conclusion**.\n Here's some single **stuff yeah\n **and another!\nhi";
        }
        try {
            const json = await response.json();
            const answer: string = json.answer;
            console.log("\n\n" + answer + "\n\n")


            return answer;
        } catch (e) {
            return "Error parsing response!";
        }

    }
}
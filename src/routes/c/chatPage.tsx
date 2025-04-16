import { FormEvent, useState } from "react";

import "./chatPage.css";

import { defaultPrompt, experimentalPrompt, models, prompterPrompt } from "../../assets/constants.ts";


export function ChatPage() {

    const [botResponse, setBotResponse] = useState("");
    const [question, setQuestion] = useState("");
    const [model, setModel] = useState(String(models[0].id));
    const [system, setSystem] = useState(experimentalPrompt);

    const [promptStuff, setPromptStuff] = useState(false);


    return (
        <>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>

            <div className={"cent"}>
                <form onSubmit={handleSubmit}>
                    <button className="submitButton" type="submit">Submit</button>
                    <br/>
                    <textarea onChange={e => setQuestion(e.target.value)} value={question} name={"question"}
                              placeholder="Question" className="question" required/>
                    <br/>

                    <div className="cent2">
                        <div className="checkbox-group">

                            <ModelSelector/>

                            <button type="button" className="promptButton"
                                    onClick={() => setPromptStuff(!promptStuff)}>Toggle
                            </button>

                            <PromptTools/>


                            <br/>
                        </div>
                    </div>
                    <textarea onChange={e => setSystem(e.target.value)} value={system} name={"system"} rows={4}
                              cols={50} placeholder="System" className="system"/>

                </form>


                <br/>
                <ResponseBox/>
            </div>

        </>
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


    function ResponseBox() {
        if (!botResponse) {
            return <></>;
        }
        return <div className="response-box">
            <p className="response">{botResponse}</p>
        </div>;
    }

    function PromptTools() {
        if (promptStuff) {
            return <>
                <button type="button" className="promptButton" onClick={resetSystem}>Default</button>
                <button type="button" className="promptButton" onClick={experimentalSystem}>Experimental</button>
                <button type="button" className="promptButton" onClick={promptSystem}>Prompter</button>
                <button type="button" className="promptButton" onClick={usePrompt}>Use</button>
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
        setBotResponse("loading..");
        setBotResponse(await submitPrompt());
    }


    async function submitPrompt() {

        const request = {
            "question": question,
            "model": model,
            system: system
        };

        const response = await fetch("chatEndpoint", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            return "Error loading data!";
        }
        try {
            const json = await response.json();
            return json["answer"];
        } catch (e) {
            return "Error parsing response!";
        }

    }
}
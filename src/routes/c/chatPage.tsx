import { FormEvent, useState } from "react";

import "./chatPage.css";
//import { models } from "../../assets/constants.ts";


export function ChatPage() {

    const [botResponse, setBotResponse] = useState("");
    const [question, setQuestion] = useState("");
    const [model, setModel] = useState("");
    const [system, setSystem] = useState("");


    return (
        <>
            <form onSubmit={handleSubmit}>
                <button className="submitButton" type="submit">Submit</button>
                <br/>
                <textarea onChange={e => setQuestion(e.target.value)} value={question} name={"question"} rows={4}
                          cols={50} placeholder="Question" className="question" required/>
                <br/>

                <select value={model} name="model" onChange={e => setModel(e.target.value)}>
                    <option value="firstOption">first option</option>
                    <option value="secondOption">second option</option>

                </select>

                <textarea onChange={e => setSystem(e.target.value)} value={system} name={"system"} rows={4}
                          cols={50} placeholder="System" className="system"/>

                <br/>

            </form>


            <br/>

            <div className="response-box">
                <p className="response">{botResponse}</p>
            </div>
        </>
    );

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
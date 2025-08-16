import {useEffect, useState} from "react";
import styles from "./dataPage.module.css";

type Entry = { content: string, created_at: number }

export function DataPage() {
    let [items, setItems] = useState<Entry[]>([]);
    let [response, setResponse] = useState("");

    useEffect(() => {
        fetchItems();

    }, []);


    return <div className={styles.dataBackground + " " + styles.main}>
        <InputForm postItem={postItem}/>
        <h2>{response}</h2>
        <br/>
        <ol>
            {items.map((item: Entry, index) => (
                <li className={styles.dataItem} key={index}>
                    {item.content}
                    <button onClick={() => copyToClipboard(item.content)} className={styles.dataButton}>Copy</button>
                </li>
            ))}
        </ol>
    </div>;

    async function copyToClipboard(text: string) {
        await navigator.clipboard.writeText(text);
    }


    function fetchItems() {
        fetch("/getdata")
            .then(res => res.json())
            .then(data => data.sort((a: Entry, b: Entry) => b.created_at - a.created_at))
            .then(data => setItems(data))
            .catch(err => console.log(err));
    }

    // @ts-ignore
    async function postItem(formData) {
        if (!formData) {
            return;
        }
        const text = formData.get("data");
        if (!text) {
            return;
        }

        const postResponse = await fetch("/postdata", {
            method: "POST",
            body: text
        });
        if (!postResponse.ok) {
            setResponse("Bad response! " + postResponse.status);
            return;
        }

        setResponse(await postResponse.text());
        fetchItems();
    }
}

// @ts-ignore
function InputForm({postItem}) {
    return <form action={postItem}>
        <button type="submit">Submit</button>
        <br/>
        <textarea name="data" required/>
    </form>;
}
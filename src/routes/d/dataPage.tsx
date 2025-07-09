import {useEffect, useState} from "react";
import styles from "./dataPage.module.css";

export function DataPage() {
    let [items, setItems] = useState([[]]);
    let [response, setResponse] = useState("");

    useEffect(() => {
        fetchItems();

    }, []);


    return <div className={styles.dataBackground + " " + styles.main}>
        <InputForm postItem={postItem}/>
        <h2>{response}</h2>
        <br/>
        <ol>
            {items.map((item, index) => (<li key={index}>{item[1]}</li>))}
        </ol>
    </div>;


    function fetchItems() {
        fetch("/getdata")
            .then(res => res.json())
            .then(data => data.sort((a: { name: number; }[], b: { name: number; }[]) => b[0].name - a[0].name))
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

        setResponse("Data posted!");
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
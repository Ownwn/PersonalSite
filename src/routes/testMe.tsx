import { useEffect, useState } from "react";

export function TestPage() {
    const [link, setLink] = useState("");

    useEffect(() => {
        getLink().then(linkValue => {
            console.log("link one!");
            setLink(linkValue);
        });
    }, []);

    return (
        <>
            <h1>Test!</h1>
            <p>this is a test page :)</p>
            <a href={link}>secret link!</a>
        </>
    );
}

async function getLink() {
    return fetch("getlink").then(res => {
        console.log("link is ", res.ok, res.status);
        return res.ok ? res.text() : "404";
    });
}
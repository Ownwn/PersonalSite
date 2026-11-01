import {FormEvent, useEffect, useRef, useState} from "react";

import styles from "./chatPage.module.css";
import Cookies from "js-cookie";


import {newPromptAug2026, models} from "../../assets/constants.ts";

import {parseHistory, readRecentChats, writeRecentChats} from './recentChats';
import type {HistoryChunk, SerialisedHistory} from './recentChats';

function formatHistoryTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const time = `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}${hours < 12 ? 'am' : 'pm'}`;
    return `${time} ${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
}

// Turns a raw SSE `data:` payload from OpenAI / Anthropic into display text.
// Returns null for non-text events. Errors are surfaced as visible text.
function extractResponseText(data: string): string | null {
    if (data === "[DONE]") return null;
    try {
        const chunk = JSON.parse(data);
        if (chunk.error) {
            return `\n[ERROR] ${typeof chunk.error === 'string' ? chunk.error : JSON.stringify(chunk.error)}\n`;
        }
        // OpenAI Responses API
        if (typeof chunk.delta === 'string') {
            return chunk.delta;
        }
        if (chunk.type && chunk.type.includes("reasoning_summary_text.done")) {
            return "\n# End Reasoning Answer\n";
        }
        // Anthropic / Deepseek
        if (chunk.type === 'content_block_delta' && chunk.delta &&
            (chunk.delta.type === 'text_delta' || chunk.delta.type === 'thinking_delta')) {
            return chunk.delta.text || chunk.delta.thinking;
        } else if (chunk.type === 'message_delta' && chunk.delta.stop_reason === 'refusal') {
            return JSON.stringify(chunk.delta)
        }
        if (chunk.type === 'content_block_start' && chunk.content_block && chunk.content_block.type === 'text') {
            return "\n# End Reasoning Answer\n";
        }
        return null;
    } catch (e) {
        console.error("Error parsing SSE data:", data, e);
        return null;
    }
}

export function ChatPage() {

    const [botResponse, setBotResponse] = useState("");
    const [question, setQuestion] = useState("");
    const [model, setModel] = useState(String(0));
    const [system, setSystem] = useState(newPromptAug2026);
    const [systemShown, setSystemShown] = useState(false)
    const [unlockTokenLimit, setUnlockTokenLimit] = useState(false)
    const [uuid, setUuid] = useState<string>(() => crypto.randomUUID())
    const [chatTitle, setChatTitle] = useState('')
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [titleDraft, setTitleDraft] = useState('')
    const [autosave, setAutosave] = useState(false)
    const [serialisedHistory, setSerialisedHistory] = useState<SerialisedHistory[]>([])
    const [recentChats, setRecentChats] = useState<SerialisedHistory[]>([])
    const [history, setHistory] = useState<HistoryChunk[]>([])
    const [historyShown, setHistoryShown] = useState(false)
    const [historyTab, setHistoryTab] = useState<'recent' | 'saved'>('recent')
    const [historySearch, setHistorySearch] = useState('')
    const [historyError, setHistoryError] = useState('')
    const [storageError, setStorageError] = useState('')
    const [saveStatus, setSaveStatus] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const busy = useRef(false)

    const [reasoningEnabled, setReasoningEnabled] = useState(true)

    const [promptStuff, setPromptStuff] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState("")

    useEffect(() => {
        const preferredSystem = Cookies.get("preferred_system");
        if (preferredSystem === undefined) {
            return;
        }

        setSystem(preferredSystem);
    }, []);

    useEffect(() => {
        void fetchSerialisedConversations()
        refreshRecentChats()
        const refresh = () => refreshRecentChats()
        window.addEventListener('storage', refresh)
        // Also expire entries while the page stays open.
        const timer = window.setInterval(refresh, 60_000)
        return () => {
            window.removeEventListener('storage', refresh)
            window.clearInterval(timer)
        }
    }, []);



    return (
        <div className={styles.chatBackground}>
            <br/>
            <br/>
            <br/>

            <div className={styles.cent}>
                <form onSubmit={handleSubmit}>
                    <button className={styles.submitButton} type="submit" disabled={isSubmitting || isSaving}>Submit</button>
                    <br/>
                    <textarea onChange={e => setQuestion(e.target.value)} value={question} name={"question"}
                              placeholder="Question" className={styles.question} required/>
                    <br/>

                    <div className={styles.cent2}>
                        <div className={styles.checkboxGroup}>

                            <select className={styles.modelselect} value={model} name="model" onChange={e => setModel(e.target.value)}>
                                {models.map((m, index) => <option value={index} key={index}>{m.cute_name}</option>)}
                            </select>



                            <PromptTools/>
                            <button type="button" className={styles.promptButton}
                                    onClick={() => setPromptStuff(!promptStuff)}>Toggle
                            </button>
                            <button type="button" className={styles.historyButton}
                                    disabled={!history.length || isSubmitting || isSaving || (autosave && saveStatus === 'Saved')}
                                    onClick={() => void saveChatToD1(history)}>
                                {isSaving ? 'Saving…' : autosave && saveStatus === 'Saved' ? 'Kept' : 'Keep'}
                            </button>
                            <button type="button" className={styles.historyButton} aria-expanded={historyShown}
                                    aria-controls="chat-history" onClick={() => setHistoryShown(!historyShown)}>History</button>
                        </div>
                    </div>
                    <div className={styles.historyStatus} role="status">{saveStatus}</div>
                    {storageError && <p role="alert">{storageError}</p>}

                    {!systemShown ? <></> : <textarea onChange={e => setSystem(e.target.value)} value={system} name={"system"} rows={4}
                                                      cols={50} placeholder="System" className={styles.system}/>}


                </form>


                {historyShown && <section id="chat-history" className={styles.historyPanel} aria-label="Chat history">
                    <div className={styles.historyTabs}>
                        <button type="button" aria-pressed={historyTab === 'recent'} onClick={() => setHistoryTab('recent')}>Recent</button>
                        <button type="button" aria-pressed={historyTab === 'saved'} onClick={() => setHistoryTab('saved')}>Saved</button>
                    </div>
                    <input className={styles.historySearch} type="search" aria-label="Search history" placeholder="Search conversations"
                           value={historySearch} onChange={e => setHistorySearch(e.target.value)}/>
                    {historyError && <p role="alert">{historyError} <button type="button" onClick={() => void fetchSerialisedConversations()}>Retry</button></p>}
                    <ul className={styles.historyList}>
                        {(historyTab === 'recent' ? recentChats : serialisedHistory)
                            .filter(chat => chat.title.toLowerCase().includes(historySearch.toLowerCase()))
                            .map(chat => <li key={chat.id}>
                                <button type="button" className={styles.historyLoad} disabled={isSubmitting || isSaving}
                                        onClick={() => loadChatFromHistory(chat, historyTab === 'saved')}>
                                    <span>{chat.title}</span>
                                    <time dateTime={new Date(chat.updated_at).toISOString()}>{formatHistoryTime(chat.updated_at)}</time>
                                </button>
                                {renamingId === chat.id ? <form onSubmit={e => {e.preventDefault(); void renameChat(chat, historyTab === 'saved')}}>
                                    <input aria-label="Conversation title" autoFocus maxLength={120} value={titleDraft}
                                           disabled={isSaving} onChange={e => setTitleDraft(e.target.value)}/>
                                    <button type="submit" disabled={isSaving || !titleDraft.trim()}>Save</button>
                                    <button type="button" disabled={isSaving} onClick={() => setRenamingId(null)}>Cancel</button>
                                </form> : <button type="button" disabled={isSubmitting || isSaving}
                                    onClick={() => {setRenamingId(chat.id); setTitleDraft(chat.title)}}>Rename</button>}
                                <button type="button" disabled={isSubmitting || isSaving} aria-label={`Delete ${chat.title}`}
                                        onClick={() => void deleteChat(chat, historyTab === 'saved')}>Delete</button>
                            </li>)}
                    </ul>
                    {!(historyTab === 'recent' ? recentChats : serialisedHistory).some(chat => chat.title.toLowerCase().includes(historySearch.toLowerCase())) &&
                        <p>{historySearch ? 'No matching conversations.' : 'No conversations yet.'}</p>}
                </section>}
                <ResponseBox/>
            </div>

        </div>
    );

    function defaultTitle(chunks: HistoryChunk[]) {
        return chunks[0].question.replace(/\s+/g, ' ').trim().substring(0, 80) || 'Untitled conversation'
    }

    async function renameChat(chat: SerialisedHistory, saved: boolean) {
        const title = titleDraft.trim()
        if (!title || title.length > 120 || isSaving || busy.current) return
        setIsSaving(true)
        try {
            if (saved) {
                const response = await fetch('savedChats', {method: 'PATCH',
                    headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: chat.id, title})})
                if (!response.ok) throw new Error('Rename failed')
                setSerialisedHistory(chats => chats.map(item => item.id === chat.id ? {...item, title} : item))
            } else {
                const chats = readRecentChats(localStorage).map(item => item.id === chat.id ? {...item, title} : item)
                writeRecentChats(localStorage, chats)
                setRecentChats(chats)
            }
            if (chat.id === uuid) setChatTitle(title)
            setRenamingId(null)
            setHistoryError('')
        } catch {
            setHistoryError('Couldn’t rename this conversation. Try again.')
        } finally {
            setIsSaving(false)
        }
    }

    function refreshRecentChats() {
        try {
            const chats = readRecentChats(localStorage)
            writeRecentChats(localStorage, chats)
            setRecentChats(chats)
            setStorageError('')
        } catch {
            setStorageError('Recent history is unavailable. Use Keep to save this conversation.')
        }
    }

    function rememberRecent(id: string, chunks: HistoryChunk[]) {
        try {
            const chats = readRecentChats(localStorage)
            const existing = chats.find(chat => chat.id === id)
            const now = Date.now()
            const updated = [{id, title: chatTitle || existing?.title || defaultTitle(chunks), body: JSON.stringify(chunks),
                created_at: existing?.created_at ?? now, updated_at: now}, ...chats.filter(chat => chat.id !== id)]
            writeRecentChats(localStorage, updated)
            setRecentChats(updated)
            setStorageError('')
        } catch {
            setStorageError('Couldn’t retain recent history. Use Keep to save this conversation.')
        }
    }

    function removeRecent(id: string) {
        try {
            const chats = readRecentChats(localStorage).filter(chat => chat.id !== id)
            writeRecentChats(localStorage, chats)
            setRecentChats(chats)
        } catch {
            setStorageError('Couldn’t update recent history in this browser.')
        }
    }

    async function fetchSerialisedConversations() {
        try {
            const response = await fetch('savedChats')
            if (!response.ok) throw new Error('Failed to load saved history')
            const chats: SerialisedHistory[] = await response.json()
            setSerialisedHistory(chats.filter(chat => !chat.title.startsWith('...ARCHIVED...'))
                .sort((a, b) => b.updated_at - a.updated_at))
            setHistoryError('')
        } catch {
            setHistoryError('Couldn’t load saved history.')
        }
    }

    function toggleHistoryButton(index: number) {
        return <button type="button" className={styles.hideButton} disabled={isSubmitting || isSaving}
                       aria-label={history[index].hidden ? 'Include turn in context' : 'Exclude turn from context'}
                       style={{backgroundColor: history[index].hidden ? 'rgba(255,34,34,0.51)' : 'rgba(34,34,255,0.51)'}}
                       onClick={() => {
                           const updated = history.map((chunk, i) => i === index ? {...chunk, hidden: !chunk.hidden} : chunk)
                           setHistory(updated)
                           rememberRecent(uuid, updated)
                           if (autosave) void saveChatToD1(updated)
                       }}><b>{history[index].hidden ? '❌' : '✓'}</b></button>
    }

    function loadChatFromHistory(chat: SerialisedHistory, saved: boolean) {
        if (busy.current || isSaving) return
        try {
            setHistory(parseHistory(chat.body))
            setUuid(chat.id)
            setChatTitle(chat.title)
            setRenamingId(null)
            setAutosave(saved)
            setSaveStatus(saved ? 'Saved' : '')
            setBotResponse('')
            setPendingQuestion('')
            setQuestion('')
            setHistoryShown(false)
        } catch {
            setHistoryError('Couldn’t open this conversation.')
        }
    }

    async function deleteChat(chat: SerialisedHistory, saved: boolean) {
        if (saved) {
            setIsSaving(true)
            try {
                const response = await fetch('savedChats', {method: 'DELETE',
                    body: JSON.stringify({id: chat.id})})
                if (!response.ok) throw new Error('Delete failed')
                setSerialisedHistory(old => old.filter(item => item.id !== chat.id))
                if (chat.id === uuid) {
                    setAutosave(false)
                    setSaveStatus('')
                }
            } catch {
                setHistoryError('Couldn’t delete this conversation.')
                return
            } finally {
                setIsSaving(false)
            }
        }
        removeRecent(chat.id)
    }

    async function saveChatToD1(newHistory: HistoryChunk[]) {
        if (!newHistory.length) return
        setIsSaving(true)
        setSaveStatus('Saving…')
        try {
            const response = await fetch('savedChats', {method: 'POST', body: JSON.stringify({
                title: chatTitle || defaultTitle(newHistory), body: newHistory, id: uuid
            })})
            if (!response.ok) throw new Error('Save failed')
            setAutosave(true)
            setSaveStatus('Saved')
            removeRecent(uuid)
            await fetchSerialisedConversations()
        } catch {
            setSaveStatus('Couldn’t save. Try Keep again.')
            rememberRecent(uuid, newHistory)
        } finally {
            setIsSaving(false)
        }
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
                            {getHeaderLine(historyPiece.question, 0, 9999)}
                        </s> : <>
                            {getHeaderLine(historyPiece.question, 0, 9999)}</>}
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
                newLine = <p key={key}>{line}</p>;
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
                <button type="button" className={styles.promptButton} onClick={() => setSystemShown(old => !old)}>Sys</button>
                <button type="button" className={styles.promptButton} style={{backgroundColor: (unlockTokenLimit ? "rgba(34,34,255,0.51)" : "rgba(255,34,34,0.51)")}}
                        onClick={() => setUnlockTokenLimit(old => !old)}>{"Inf tok " + (unlockTokenLimit ? "Y" : "N")}
                </button>
                <button type="button" className={styles.promptButton} style={{backgroundColor: (reasoningEnabled ? "rgba(34,34,255,0.51)" : "rgba(255,34,34,0.51)")}}
                        onClick={() => setReasoningEnabled(old => !old)}>Thk:{reasoningEnabled ? "Y" : "N"}
                </button>
            </>;
        }

        return <></>;
    }


    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (busy.current || isSaving) return
        busy.current = true
        setIsSubmitting(true)
        setBotResponse("Loading...");
        setPendingQuestion(question)
        try {
            await submitPrompt();
        } catch {
            setBotResponse('The response was interrupted. Any received text has been retained.')
        } finally {
            busy.current = false
            setIsSubmitting(false)
        }
    }


    async function submitPrompt() {
        const request = {
            question: question,
            model_id: model,
            system_prompt: system,
            history: history.filter(h => !h.hidden),
            reasoning: reasoningEnabled,
            options: {extraTokens: unlockTokenLimit}
        };

        // Retain the submitted question even if the page is refreshed during a response.
        rememberRecent(uuid, [...history, {question, response: '', hidden: false}])
        const response = await fetch("chatEndpoint", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        if (!response.body || !response.ok) {
            setBotResponse("Failed " + String(response.status) + " " + String(await response.text()).substring(0, 300));
            return;
        }
        const oldQuestion = question

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let res = "";
        let lastRetained = 0;
        function retainPartialResponse() {
            if (Date.now() - lastRetained < 1000) return
            rememberRecent(uuid, [...history, {question: oldQuestion, response: res, hidden: false}])
            lastRetained = Date.now()
        }

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
                    if (line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]') {
                            return;
                        }

                        const text = extractResponseText(data);
                        if (text != null) {
                            setBotResponse(prev => prev + text);
                            res += text;
                            retainPartialResponse();
                        }
                    }
                }
            }

            if (buffer.trim() && buffer.startsWith('data:')) {
                const data = buffer.slice(5).trim();
                if (data !== '[DONE]') {
                    const text = extractResponseText(data);
                    if (text != null) {
                        setBotResponse(prev => prev + text);
                        res += text;
                    }
                }
            }
        } finally {
            reader.releaseLock();
            const newHistory = [...history, {question: oldQuestion, response: res, hidden: false}]
            rememberRecent(uuid, newHistory)
            setHistory(newHistory)
            setBotResponse('')
            if (autosave) await saveChatToD1(newHistory)

        }
    }
}

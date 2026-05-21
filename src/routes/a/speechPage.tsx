// this file written using AI, might be sloppy

import {useState, useRef} from 'react';
import styles from "./speechPage.module.css"

export function SpeechPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [delta, setDelta] = useState("");

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const commitIntervalRef = useRef<number | null>(null);

    const startRecording = async () => {
        try {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/speechEndpoint`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    type: "session.update",
                    session: {
                        type: "transcription",
                        audio: {
                            input: {
                                format: {type: "audio/pcm", rate: 24000},
                                transcription: {model: "gpt-realtime-whisper", language: "en", delay: "xhigh"}
                            }
                        }
                    }
                }));
            };

            ws.onerror = (e) => console.error("WebSocket Error:", e);
            ws.onclose = (e) => console.log("WebSocket Closed:", e.code, e.reason);

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);


                if (data.type === "error") {
                    console.error("OpenAI API Error:", data.error);
                    alert("OpenAI Error: " + data.error.message);
                }

                if (data.type === "conversation.item.input_audio_transcription.delta") {
                    setDelta(data.delta);
                }

                if (data.type === "conversation.item.input_audio_transcription.completed") {
                    setTranscript((prev) => (prev + " " + data.transcript).trim());
                    setDelta("");
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            streamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass({sampleRate: 24000});
            audioContextRef.current = audioContext;
            await audioContext.resume();

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;

            source.connect(processor);
            processor.connect(gainNode);
            gainNode.connect(audioContext.destination);

            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const channelData = e.inputBuffer.getChannelData(0);
                    const pcm16 = new Int16Array(channelData.length);

                    for (let i = 0; i < channelData.length; i++) {
                        const s = Math.max(-1, Math.min(1, channelData[i]));
                        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    const buffer = new Uint8Array(pcm16.buffer);
                    let binary = "";
                    for (let i = 0; i < buffer.byteLength; i++) {
                        binary += String.fromCharCode(buffer[i]);
                    }

                    ws.send(JSON.stringify({
                        type: "input_audio_buffer.append",
                        audio: btoa(binary)
                    }));
                }
            };

            commitIntervalRef.current = window.setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({type: "input_audio_buffer.commit"}));
                }
            }, 2500);

            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing mic or websocket:", err);
            alert("Could not start recording. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (commitIntervalRef.current) clearInterval(commitIntervalRef.current);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({type: "input_audio_buffer.commit"}));
            setTimeout(() => wsRef.current?.close(), 1500);
        }

        if (processorRef.current) processorRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();

        setIsRecording(false);
    };

    return (
        <div className={styles.box}>

            <button onClick={isRecording ? stopRecording : startRecording} className={styles.button}>
                {isRecording ? "Stop" : "Start"}
            </button>

            <div style={{
                marginTop: '20px', padding: '20px', border: '1px solid #d1d5db',
                borderRadius: '8px', minHeight: '150px', backgroundColor: '#f9fafb', lineHeight: 1.6
            }}>
                <span style={{color: '#111827'}}>{transcript}</span>
                <span style={{color: '#6b7280', marginLeft: transcript ? '4px' : '0'}}>{delta}</span>
            </div>
        </div>
    );
}
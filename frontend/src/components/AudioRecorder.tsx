import React, { useState, useRef, useEffect, useCallback } from "react";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { pushErrorNotification } from "./Notifications";

enum RECORDING_STATE {
    IDLE,
    RECORDING,
    RECORDED,
}

interface IAudioRecorderProps {
    setAudioBlob: (audioBlob: Blob | null) => void;
}

const AudioRecorder: React.FunctionComponent<IAudioRecorderProps> = ({ setAudioBlob }) => {
    const [isRecording, setIsRecording] = useState<RECORDING_STATE>(RECORDING_STATE.IDLE);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    const [time, setTime] = useState<number>(0);
    const audioRecorderRef = useRef<MediaRecorder | null>(null);

    const timeRef = useRef<any | null>(null);

    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;

        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    const getPermission = async () => {
        if ("MediaRecorder" in window) {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({ audio: true });

                setStream(streamData);
            } catch (err) {
                pushErrorNotification({
                    title: "Error",
                    message: "Permission denied to record audio",
                });
                setIsRecording(RECORDING_STATE.IDLE);
            }
        } else {
            pushErrorNotification({
                title: "Error",
                message: "Media Recording APIs not supported in your browser",
            });
            setIsRecording(RECORDING_STATE.IDLE);
        }
    };

    const startRecording = useCallback(() => {
        if (!stream) return;

        const media = new MediaRecorder(stream, { mimeType: "audio/webm" });

        audioRecorderRef.current = media;

        audioRecorderRef.current.start();
        let localAudioChunks: Blob[] = [];
        audioRecorderRef.current.ondataavailable = (e) => {
            if (typeof e.data === "undefined") return;

            if (e.data.size === 0) return;

            localAudioChunks.push(e.data);
        };

        setAudioChunks(localAudioChunks);
    }, [stream]);

    const stopRecording = () => {
        setIsRecording(RECORDING_STATE.RECORDED);

        if (!audioRecorderRef.current) return;

        audioRecorderRef.current.stop();

        audioRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

            setAudioBlob(audioBlob);
        };

        setIsRecording(RECORDING_STATE.IDLE);
    };

    const handleClick = async () => {
        switch (isRecording) {
            case RECORDING_STATE.IDLE:
                await getPermission();
                setIsRecording(RECORDING_STATE.RECORDING);
                break;
            case RECORDING_STATE.RECORDING:
                stopRecording();
                break;
            case RECORDING_STATE.RECORDED:
                break;
            default:
                throw new Error("That wasn't expected");
        }
    };

    useEffect(() => {
        if (isRecording === RECORDING_STATE.RECORDING && stream) {
            timeRef.current = setInterval(() => {
                setTime((time) => time + 1);
            }, 1000);

            startRecording();
        } else {
            setTime(0);
            if (timeRef.current) clearInterval(timeRef.current);
        }

        return () => clearInterval(timeRef.current);
    }, [isRecording, stream, startRecording]);

    return (
        <label className="send-input" onClick={handleClick}>
            {isRecording === RECORDING_STATE.RECORDING ? (
                <div className="audio-recording-state" title="Stop Recording">
                    <span className="time">{formatTime(time)}</span>
                    <span className="red-blink"></span>
                </div>
            ) : (
                <FontAwesomeIcon icon={faMicrophone} />
            )}
        </label>
    );
};

export default AudioRecorder;

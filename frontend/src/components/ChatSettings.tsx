import React, { useState, useRef, useEffect } from "react";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faPencil, faUsers } from "@fortawesome/free-solid-svg-icons";
import useDefaultImage from "../hooks/useDefaultImage";
import axios from "axios";
import { pushErrorNotification, pushSuccessNotification } from "./Notifications";

import { useAuth } from "../contexts/AuthContext";
import AddGroupMemberModal from "./AddGroupMemberModal";

interface IChatSettingsProps {
    conversation: Conversation;
    setConversation: (x: Conversation) => void;
    setOpen: (x: boolean) => void;
    open: boolean;
}

const ChatSettings: React.FunctionComponent<IChatSettingsProps> = ({
    conversation,
    setOpen,
    setConversation,
    open,
}) => {
    const { user } = useAuth()!;
    const [participants, setParticipants] = useState<boolean>(false);
    const [overviewPicHover, setOverviewPicHover] = useState<boolean>(false);
    const [addMember, setAddMember] = useState<boolean>(false);
    const [admin, setAdmin] = useState<boolean>(false);
    const divRef = useRef<HTMLDivElement>(null);

    const defaultImage = useDefaultImage();

    const [picture, setPicture] = useState<string>(conversation.picture || defaultImage);

    useEffect(() => {
        setPicture(conversation.picture || defaultImage);
    }, [defaultImage, conversation.picture]);

    useEffect(() => {
        if (!divRef.current || !open) return;

        divRef.current.focus();
    }, [open]);

    useEffect(() => {
        const member = conversation.members.find((m) => m.userId === user?.id);
        if (!member) return;

        setAdmin(member.admin);
    }, [conversation, user?.id]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("test");
        if (!e.target.files || e.target.files?.length === 0) {
            setPicture(conversation.picture || defaultImage);
            return;
        }

        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            setPicture(conversation.picture || defaultImage);
            return;
        }

        // Uploading to the server!!
        const formData = new FormData();
        formData.append("cid", conversation.id);
        formData.append("group_photo", file);

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/chat/update-group-picture`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Could not update!",
                });
                return;
            }

            setPicture(data.image);
            setConversation({ ...conversation, picture: data.image });

            pushSuccessNotification({
                title: "Upload successful!",
                message: "Group photo has been updated.",
            });
        } catch (err) {
            pushErrorNotification({
                title: "Error",
                message: "Could not reach server",
            });
            console.error(`[#] Could not reach to server!`);
            setPicture(conversation.picture || defaultImage);
        }
    };

    const handleExportToText = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/chat/download-chat`, {
                method: "POST",
                body: JSON.stringify({ cid: conversation.id }),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const blob = await response.blob();

            const URL = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = URL;
            a.download = `chats-${conversation.name}.txt`;
            a.click();
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Couldn't download the chats",
            });
        }
    };

    const handleToggleDisappearingMessage = async () => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/chat/update-group-mode`,
                {
                    disappearingMode: !conversation.disappearingMode,
                    cid: conversation.id,
                },
                { withCredentials: true }
            );

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Could not update group mode :(",
                });
                return;
            }

            const newConversation: Conversation = {
                ...conversation,
                disappearingMode: !conversation.disappearingMode,
            };
            setConversation(newConversation);
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Permission Denied to toggle disappearing message mode",
            });
        }
    };

    return (
        <div
            className="chat-settings"
            onClick={() => setOpen(true)}
            tabIndex={1}
            onBlur={() => setTimeout(() => setOpen(false), 250)}
            onMouseDown={(e) => e.preventDefault()}
            style={!open ? { display: "none" } : {}}
            ref={divRef}
        >
            <div className="chat-settings__menu">
                <div
                    className={`chat-settings__menu_opt ${participants ? "" : "active"}`}
                    onClick={() => {
                        setParticipants(false);
                    }}
                >
                    <FontAwesomeIcon icon={faCircleInfo} />
                    Overview
                </div>
                <div
                    className={`chat-settings__menu_opt ${participants ? "active" : ""}`}
                    onClick={() => {
                        setParticipants(true);
                    }}
                >
                    <FontAwesomeIcon icon={faUsers} />
                    Participants
                </div>
            </div>
            <div className={`chat-settings__general ${participants ? "participants" : "overview"}`}>
                {!participants ? (
                    <>
                        <div className="detail">
                            <div
                                style={{
                                    backgroundImage: `url(${picture})`,
                                }}
                                className="picture"
                                onMouseOver={() => setOverviewPicHover(true)}
                                onMouseOut={() => setOverviewPicHover(false)}
                            >
                                {overviewPicHover && (
                                    <label className="hover-screen" htmlFor="group-photo">
                                        <input
                                            type="file"
                                            style={{ display: "none" }}
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            id="group-photo"
                                        />
                                        <FontAwesomeIcon icon={faPencil} />
                                    </label>
                                )}
                            </div>
                            <div className="name">{conversation.name}</div>
                        </div>
                        <div className="chat-settings__option">
                            <span>Export chat to a Text file</span>
                            <button
                                className="btn ett"
                                id="export-to-txt"
                                onClick={handleExportToText}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                Export to text
                            </button>
                        </div>
                        <div className="chat-settings__option">
                            <span>Group Settings</span>
                            <button className="btn leave-group" id="leave-group">
                                Leave Group
                            </button>
                            {admin && (
                                <>
                                    <button
                                        className="btn add-members"
                                        onClick={() => setAddMember(true)}
                                    >
                                        Add Member
                                    </button>
                                    <AddGroupMemberModal
                                        isOpen={addMember}
                                        setOpen={setAddMember}
                                        conversationId={conversation.id}
                                    />
                                    <button
                                        className={`disappearing-message ${
                                            conversation.disappearingMode ? "secondary-btn" : "btn"
                                        }`}
                                        onClick={handleToggleDisappearingMessage}
                                    >
                                        Disappearing Messages:{" "}
                                        {conversation.disappearingMode ? "ON" : "OFF"}
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h3>Participants</h3>
                        <div className="chat-settings__participants">
                            <div className={`chat-settings__participant ${admin ? "admin" : ""}`}>
                                <div
                                    className="picture"
                                    style={{
                                        backgroundImage: `url(${user?.picture || defaultImage})`,
                                    }}
                                ></div>
                                <h4>{user?.username}</h4>
                                <span className="badge">You {admin && "& Admin"}</span>
                            </div>
                            {conversation.members.map((member) => {
                                if (member.userId === user?.id)
                                    return <span key={member.userId}></span>;
                                return (
                                    <div
                                        className={`chat-settings__participant ${
                                            member.admin ? "admin" : ""
                                        }`}
                                        key={member.userId}
                                    >
                                        <div
                                            className="picture"
                                            style={{
                                                backgroundImage: `url(${
                                                    member.picture || defaultImage
                                                })`,
                                            }}
                                        ></div>
                                        <h4>{member.username}</h4>
                                        {member.admin && <span className="badge">Admin</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatSettings;

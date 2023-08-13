import React, { useState } from "react";
import Modal from "./Modal";
import { Conversation } from "../pages/Dashboard";
import axios from "axios";
import { pushErrorNotification } from "./Notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

interface ICreateGroupModal {
    isOpen: boolean;
    setIdx: (x: number) => void;
    setConversation: (x: Conversation[] | ((x: Conversation[]) => Conversation[])) => void;
}

const CreateDMModal: React.FunctionComponent<ICreateGroupModal> = ({
    isOpen,
    setIdx,
    setConversation,
}) => {
    const [username, setUsername] = useState<string>("");
    const [validUsername, setValidUsername] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/chat/create-dm`,
                {
                    username,
                },
                { withCredentials: true }
            );

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Could not create new DM!",
                });
                return;
            }

            setConversation((conversations) => [data.chat, ...conversations]);

            setIdx(-1);
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Could not create new DM!",
            });
        } finally {
            setUsername("");
        }
    };

    const checkUsername = async (possibleUsername: string) => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/auth/check-username`,
                {
                    username: possibleUsername,
                }
            );

            if (!data) {
                pushErrorNotification({
                    title: "Internal Server Error",
                    message: "",
                });
                setValidUsername(false);
                return;
            }

            setValidUsername(!data.success);
        } catch (err) {
            console.error(`[#] Error: ${err}`);
            setValidUsername(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={(x) => {
                if (!x) setIdx(-1);
            }}
        >
            <form className="modal-form" onSubmit={handleSubmit}>
                <div className="modal-form-field">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            checkUsername(e.target.value);
                        }}
                        id="username-field"
                        name="username-field"
                        className="primary-input"
                    />
                    {username && (
                        <FontAwesomeIcon
                            icon={validUsername ? faCheck : faXmark}
                            title={validUsername ? "Valid User" : "Invalid user"}
                            style={{
                                color: `${validUsername ? "#799964" : "#ff4d4d"}`,
                            }}
                        />
                    )}
                    <label htmlFor="username-field">Username</label>
                </div>
                <input type="submit" value="Create DM" className="btn" />
            </form>
        </Modal>
    );
};

export default CreateDMModal;

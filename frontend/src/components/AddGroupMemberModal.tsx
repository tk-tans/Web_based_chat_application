import React, { useState } from "react";
import Modal from "./Modal";
import axios from "axios";
import { pushErrorNotification } from "./Notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

interface IAddGroupModal {
    isOpen: boolean;
    setOpen: (x: boolean) => void;
    conversationId: string;
}

const AddGroupMemberModal: React.FunctionComponent<IAddGroupModal> = ({
    isOpen,
    setOpen,
    conversationId,
}) => {
    const [username, setUsername] = useState<string>("");
    const [validUsername, setValidUsername] = useState<boolean>(false);

    const handleSubmit = async () => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/chat/add-group-member`,
                {
                    username,
                    cid: conversationId,
                },
                { withCredentials: true }
            );

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Could not add new member to group!",
                });
                return;
            }

            setOpen(false);
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Could not add new member to group!",
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
        <Modal isOpen={isOpen} setIsOpen={setOpen}>
            <form
                className="modal-form"
                onSubmit={(e) => {
                    e.preventDefault();

                    if (!validUsername) {
                        pushErrorNotification({
                            title: "Invalid username",
                            message: "User with that uesrname doesn't exist",
                        });
                        return;
                    }

                    setUsername("");
                }}
            >
                <div className="modal-form-field">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            checkUsername(e.target.value);
                        }}
                        required
                        id="username-field"
                        name="username-field"
                        className="primary-input"
                        tabIndex={2}
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
                <input
                    type="submit"
                    value="Add Member to Group"
                    className="btn"
                    onClick={handleSubmit}
                />
            </form>
        </Modal>
    );
};

export default AddGroupMemberModal;

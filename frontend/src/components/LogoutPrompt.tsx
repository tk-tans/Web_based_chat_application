import React from "react";
import Modal from "./Modal";
import axios from "axios";
import { pushErrorNotification } from "./Notifications";
import { useAuth } from "../contexts/AuthContext";

interface ICreateGroupModal {
    isOpen: boolean;
    setIdx: (x: number) => void;
}

const LogoutPrompt: React.FunctionComponent<ICreateGroupModal> = ({ isOpen, setIdx }) => {
    const { setUser } = useAuth()!;

    const logout = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/logout`, {
            withCredentials: true,
        });

        setUser(null);

        if (!data || !data.success) {
            pushErrorNotification({
                title: "Error",
                message: "Try refreshing the browser",
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={(x) => {
                if (!x) setIdx(-1);
            }}
        >
            <form className="modal-form-logout" onSubmit={logout}>
                <h2>Do you want to logout?</h2>
                <div className="modal-form-logout-btns">
                    <button className="secondary-btn" onClick={() => setIdx(-1)}>
                        Cancel
                    </button>
                    <input type="submit" value="Logout" className="btn" />
                </div>
            </form>
        </Modal>
    );
};

export default LogoutPrompt;

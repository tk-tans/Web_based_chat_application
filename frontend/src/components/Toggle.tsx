import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React from "react";

interface IToggleProps {
    select: boolean;
    setSelect: (flag: boolean | ((f: boolean) => boolean)) => void;
}

const Toggle: React.FC<IToggleProps> = ({ select, setSelect }) => {
    const updateTheme = async (theme: boolean) => {
        try {
            await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/auth/update-theme`,
                {
                    theme,
                },
                { withCredentials: true }
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div
            className="toggle-btn"
            onClick={() => {
                setSelect((s) => !s);
                updateTheme(!select);
            }}
        >
            <div className={`toggle-btn__circle ${select ? "move-right" : "move-left"}`}>
                <FontAwesomeIcon
                    icon={!select ? faSun : faMoon}
                    size="xs"
                    style={{ color: !select ? "#ffe74d" : "#1f3356" }}
                />
            </div>
        </div>
    );
};

export default Toggle;

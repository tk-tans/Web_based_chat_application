import { faEllipsisV, faGear } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IOptionsProps {
    options: {
        name: string;
    }[];
    setOptionSelectedIdx: (x: number) => void;
    vertical?: "top" | "bottom";
    horizontal?: "right" | "left";
    gear?: boolean;
}

const Options: React.FunctionComponent<IOptionsProps> = ({
    options,
    setOptionSelectedIdx,
    vertical = "bottom",
    horizontal = "right",
    gear = false,
}) => {
    const [selected, setSelected] = useState<boolean>(false);

    return (
        <div
            className="options"
            onClick={() => setSelected((s) => !s)}
            tabIndex={0}
            onBlur={() => setSelected(false)}
        >
            <FontAwesomeIcon icon={gear ? faGear : faEllipsisV} size="1x" />
            {selected && (
                <div
                    className="options__menu"
                    style={{
                        transform: `translate(${horizontal === "right" ? "0" : "100"}%, ${
                            vertical === "bottom" ? "0" : "-130"
                        }%)`,
                    }}
                >
                    {options.map((option, idx) => {
                        return (
                            <div
                                key={idx}
                                className="options__menu__field"
                                onClick={() => setOptionSelectedIdx(idx)}
                            >
                                {option.name}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Options;

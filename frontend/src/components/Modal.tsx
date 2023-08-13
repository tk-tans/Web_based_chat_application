import React, { useRef } from "react";
import useEventListener from "../hooks/useEventListener";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface IModal {
    isOpen: boolean;
    setIsOpen: (x: boolean) => void;
    children: any;
}

const Modal: React.FunctionComponent<IModal> = ({ isOpen, setIsOpen, children }) => {
    const backgroundRef = useRef(null);

    useEventListener("mousedown", (e: Event) => {
        if (e.target === backgroundRef.current && isOpen) {
            setIsOpen(false);
        }
    });

    return ReactDOM.createPortal(
        <>
            {isOpen && (
                <div ref={backgroundRef} className="background">
                    <div className="modal">
                        <div className="body">{children}</div>
                        <FontAwesomeIcon icon={faXmark} onClick={() => setIsOpen(false)} />
                    </div>
                </div>
            )}
        </>,
        document.querySelector("#portal")!
    );
};

export default Modal;

import { useState } from "react";
import Options from "./Options";

import CreateDMModal from "./CreateDMModal";
import CreateGroupModal from "./CreateGroupModal";
import { Conversation } from "../pages/Dashboard";

const OPTIONS = ["Create a DM", "Create a Group"];

interface INewChatOptions {
    setConversations: (x: Conversation[] | ((x: Conversation[]) => Conversation[])) => void;
}

const NewChatOptions: React.FunctionComponent<INewChatOptions> = ({ setConversations }) => {
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);

    return (
        <>
            <CreateDMModal
                isOpen={selectedIdx === 0}
                setIdx={setSelectedIdx}
                setConversation={setConversations}
            />
            <CreateGroupModal isOpen={selectedIdx === 1} setIdx={setSelectedIdx} />
            <Options
                options={OPTIONS.map((x) => ({ name: x }))}
                setOptionSelectedIdx={setSelectedIdx}
            />
        </>
    );
};

export default NewChatOptions;

import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Loading = () => {
    return (
        <main className="container loading-page">
            <FontAwesomeIcon size="xl" icon={faCircleNotch} />
            <h2>Loading...</h2>
        </main>
    );
};

export default Loading;

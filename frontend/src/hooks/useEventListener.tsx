import { useEffect, useRef } from "react";

const useEventListener = (eventType: string, handler: EventListener) => {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        function internalHandler(e: Event | KeyboardEvent) {
            return handlerRef.current(e);
        }
        document.addEventListener(eventType, internalHandler);

        return () => {
            document.removeEventListener(eventType, internalHandler);
        };
    }, [eventType]);
};

export default useEventListener;

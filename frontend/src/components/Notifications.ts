import addNotification from "react-push-notification"

interface INotification {
    title: string,
    message: string
}

export const pushErrorNotification = ({ title, message }: INotification) => {
    addNotification({
        title: "Error",
        subtitle: title,
        message,
        theme: "red",
    })
}

export const pushSuccessNotification = ({ title, message }: INotification) => {
    addNotification({
        title: "Success",
        subtitle: title,
        message,
        theme: "light"
    })
}
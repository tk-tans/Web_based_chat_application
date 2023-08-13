import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import lightModeUser from "../assets/light_mode_user.png";
import darkModeUser from "../assets/dark_mode_user.png";

const useDefaultImage = () => {
    const { theme } = useAuth()!;
    const [image, setImage] = useState<string>(theme ? darkModeUser : lightModeUser);

    useEffect(() => {
        setImage(theme ? darkModeUser : lightModeUser);
    }, [theme]);

    return image;
};

export default useDefaultImage;

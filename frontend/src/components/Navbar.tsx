import { useEffect } from "react";
import Toggle from "./Toggle";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
    const { theme, setTheme } = useAuth()!

    useEffect(() => {
        if (theme) document.body.classList.add("dark");
        else document.body.classList.remove("dark");
    }, [theme]);

    return (
        <nav className={`navbar ${theme ? "dark" : ""}`}>
            <Toggle select={theme} setSelect={setTheme} />
        </nav>
    );
};

export default Navbar;

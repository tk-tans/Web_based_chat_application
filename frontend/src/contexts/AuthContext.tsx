import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export type User = {
    id: string;
    username: string;
    email: string;
    name: string;
    createdAt: Date;
    picture: string | undefined;
};

interface IContext {
    user: User | null;
    setUser: (user: User | null) => void;
    loading: boolean;
    setLoading: (flag: boolean) => void;
    pointerLoading: boolean;
    setPointerLoading: (flag: boolean) => void;
    theme: boolean;
    setTheme: (flag: boolean | ((f: boolean) => boolean)) => void;
}

const AuthContext = createContext<IContext | null>(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider = (props: any) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [theme, setTheme] = useState<boolean>(true);
    const [pointerLoading, setPointerLoading] = useState<boolean>(false);

    const defaultLogin = async () => {
        setLoading(true);
        setPointerLoading(true);
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/get-user`, {
                withCredentials: true,
            });
            if (!data || !data.success) setUser(null);
            else {
                setUser(data.user);
                setTheme(data.user.dark);
            }
        } catch (err) {
            console.error(`[#] Cannot reach server at this moment!`);
            setUser(null);
        } finally {
            setLoading(false);
            setPointerLoading(false);
        }
    };

    useEffect(() => {
        if (!pointerLoading) {
            document.body.classList.remove("loading");
        } else {
            document.body.classList.add("loading");
        }
    }, [pointerLoading]);

    useEffect(() => {
        defaultLogin();
    }, []);

    const value = {
        user,
        setUser,
        loading,
        setLoading,
        pointerLoading,
        setPointerLoading,
        theme,
        setTheme,
    };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

export default AuthProvider;

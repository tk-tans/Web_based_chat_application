import { useAuth } from "../contexts/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import Loading from "../pages/Loading";

const PublicRoute = () => {
    const { user, loading } = useAuth()!;
    return loading ? <Loading /> : user ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;

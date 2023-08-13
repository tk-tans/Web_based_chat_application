import { useAuth } from "../contexts/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import Loading from "../pages/Loading";

const PrivateRoute = () => {
    const { user, loading } = useAuth()!;
    return loading ? <Loading /> : user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;

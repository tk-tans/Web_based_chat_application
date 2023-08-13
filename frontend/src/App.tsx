import AuthProvider from "./contexts/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import { Notifications } from "react-push-notification";
import Profile from "./pages/Profile";

const App = () => {
    return (
        <AuthProvider>
            <Notifications />
            <Navbar />
            <Router>
                <Routes>
                    <Route path="/" element={<PrivateRoute />}>
                        <Route path="" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>
                    <Route path="/login" element={<PublicRoute />}>
                        <Route path="" element={<Login />} />
                    </Route>
                    <Route path="/signup" element={<PublicRoute />}>
                        <Route path="" element={<Signup />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;

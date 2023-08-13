import { Router } from "express";

import {
    checkUsername,
    getUser,
    getUserStatus,
    login,
    logout,
    removeProfilePicture,
    signup,
    updateProfile,
    updateProfilePicture,
    updateTheme,
} from "../controllers/authentication";
import { authorization } from "../middlewares/authentication";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/check-username", checkUsername);

// Private Routes
router.use(authorization);

router.get("/get-user", getUser);
router.post("/update-profile", updateProfile);
router.post("/update-profile-picture", updateProfilePicture);

router.get("/get-user-status", getUserStatus);

router.post("/update-theme", updateTheme);

router.get("/remove-profile-picture", removeProfilePicture);

export default router;

import { Router } from "express";
import {
    authorization,
    groupAdminAuthorization,
    memberAuthorization,
} from "../middlewares/authentication";
import {
    addGroupMember,
    createDM,
    createGroup,
    deleteMessage,
    getChats,
    getMembers,
    leaveGroup,
    recordMessage,
    removeGroupMember,
    toggleAdminStatus,
    updateGroupName,
    updateGroupMode,
    updateGroupPhoto,
    downloadChat,
} from "../controllers/chat";
import { chatResourceUpload } from "../multer";

const router = Router();

// Normal Member routes
router.use(authorization);

router.get("/get-chats", getChats);
router.get("/get-members", getMembers);
router.get("/leave-group", leaveGroup);
router.post("/create-dm", createDM);
router.post("/create-group", createGroup);

// member authorized routes
router.post("/message", chatResourceUpload.single("file"), recordMessage);
router.post("/update-group-picture", updateGroupPhoto);

router.use(memberAuthorization);
router.post("/delete-message", deleteMessage);
router.post("/download-chat", downloadChat);

// Group Admin routes
router.use(groupAdminAuthorization);

router.post("/add-group-member", addGroupMember);

router.post("/update-group-name", updateGroupName);
router.post("/update-group-mode", updateGroupMode);

router.post("/remove-member", removeGroupMember);
router.post("/toggle-admin-status", toggleAdminStatus);

export default router;

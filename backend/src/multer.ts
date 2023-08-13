import multer from "multer";
import {
    AdminAuthenticatedUserRequest,
    AuthenticatedUserRequest,
    MemberAuthenticatedRequest,
} from "./types";
import { FILE_SCOPE, GET_PATH } from "./utils";

const profilePictureStorage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, GET_PATH[FILE_SCOPE.PROFILE]);
    },
    filename: (_req, file, cb) => {
        const req = _req as AuthenticatedUserRequest;
        const randomSuffix = Date.now() + Math.floor(Math.random() * 1e9);

        const filename = file.originalname.replace(/[ #<>":/\|?*]/g, "_");

        cb(null, `${req.userId}-${randomSuffix}.${filename.split(".").pop()}`);
    },
});
export const profilePictureUpload = multer({ storage: profilePictureStorage });

const groupPictureStorage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, GET_PATH[FILE_SCOPE.GROUP_PROFILE]);
    },
    filename: (_req, file, cb) => {
        const randomSuffix = Date.now() + Math.floor(Math.random() * 1e9);

        const filename = file.originalname.replace(/[ #<>":/\|?*]/g, "_");

        cb(null, `${_req.body.cid}-${randomSuffix}.${filename.split(".").pop()}`);
    },
});
export const groupPictureUpload = multer({ storage: groupPictureStorage });

const chatResourceStorage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, GET_PATH[FILE_SCOPE.CHAT_FILE]);
    },
    filename: (_req, file, cb) => {
        const req = _req as MemberAuthenticatedRequest;

        const randomSuffix = Date.now() + Math.floor(Math.random() * 1e9);

        const filename = file.originalname.replace(/[ #<>":/\|?*]/g, "_");

        // $$$$ acts as split filter, pretty sus lmaoo
        cb(null, `${req.body.cid}-${req.userId}-${randomSuffix}-$$$$-${filename}`);
    },
});
export const chatResourceUpload = multer({ storage: chatResourceStorage });

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/config";
import {
    AdminAuthenticatedUserRequest,
    AuthenticatedUserRequest,
    AuthenticatedUserSocket,
    MemberAuthenticatedRequest,
} from "../types";
import { prisma } from "../prisma";

import { Socket } from "socket.io";

export const authorization = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === "string" || data instanceof String) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        (req as AuthenticatedUserRequest).userId = data.id;

        next();
    } catch (err) {
        console.log(err);
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};

export const groupAdminAuthorization = async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    if (!req.userId) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const member = await prisma.member.findUnique({
            where: { uid_cid: { uid: req.userId, cid: req.body.cid } },
            select: { admin: true },
        });

        if (!member || !member.admin)
            return res.status(403).json({ success: false, message: "Forbidden" });

        (req as AdminAuthenticatedUserRequest).chatId = req.body.cid;

        return next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const memberAuthorization = async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    if (!req.userId) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const member = await prisma.member.findUnique({
            where: { uid_cid: { uid: req.userId, cid: req.body.cid } },
            select: { cid: true },
        });

        if (!member) return res.status(403).json({ success: false, message: "Forbidden" });

        (req as MemberAuthenticatedRequest).chatId = member.cid;

        return next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const parseCookies = (cookiesString: string | undefined) => {
    if (!cookiesString) throw "Did not find any cookie!";

    const cookies: { [key: string]: string } = {};
    cookiesString.split(";").forEach((cookieKeyValue) => {
        const [key, value] = cookieKeyValue.trim().split("=");
        cookies[key] = value;
    });

    return cookies;
};

export const socketAuthorization = (socket: Socket, next: (err?: Error | undefined) => void) => {
    try {
        const cookies = parseCookies(socket.handshake.headers["cookie"]);

        if (!cookies.jwt) return next(new Error("JWT not found!"));

        const token = cookies.jwt;
        const data = jwt.verify(token, TOKEN_SECRET);

        if (typeof data === "string" || data instanceof String)
            return next(new Error("Invalid JWT"));

        (socket as AuthenticatedUserSocket).userId = data.id;

        next();
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);

        return next(new Error(`${e}`));
    }
};

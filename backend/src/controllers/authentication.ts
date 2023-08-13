import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";

import { prisma } from "../prisma";
import { FILE_SCOPE, FORM_STATIC_URL, GET_PATH, serializeUser } from "../utils";
import { profilePictureUpload } from "../multer";

import { AuthenticatedUserRequest } from "../types";
import { COOKIE_CONFIG, TOKEN_SECRET } from "../config/config";

import * as fs from "fs/promises";
import path from "path";

export const signup = async (req: Request, res: Response) => {
    const { body } = req;

    if (!body) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    const { name, email, password, username, theme } = body;

    if (!name || !email || !password || !username || !theme)
        return res.status(400).json({ success: false, message: "Malformed body" });

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const id = uuidv4();

        const user = await prisma.user.create({
            data: {
                id,
                name,
                password: hashedPassword,
                email,
                username,
                online: false,
                lastOnline: new Date(),
                dark: theme,
                devicesOnline: 0,
            },
        });

        return res
            .status(200)
            .json({ success: true, message: "Created new user", user: serializeUser(user) });
    } catch (err) {
        return res
            .status(403)
            .json({ success: false, message: "Couldn't insert into the database" });
    }
};

export const login = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ success: false, message: "Malformed body" });

    try {
        const user =
            (await prisma.user.findUnique({
                where: { username },
            })) ||
            (await prisma.user.findUnique({
                where: { email: username },
            }));

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const result = await bcrypt.compare(password, user.password);

        if (!result) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = jwt.sign({ id: user.id }, TOKEN_SECRET, {
            expiresIn: "10d",
        });

        return res
            .cookie("jwt", token, COOKIE_CONFIG)
            .status(200)
            .json({
                success: true,
                message: "Logged in successfully!",
                user: serializeUser(user),
            });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const logout = (_: Request, res: Response) => {
    return res
        .clearCookie("jwt")
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
};

export const getUser = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Unidentified Id" });
        }

        return res
            .status(200)
            .json({ success: true, message: "Valid User", user: serializeUser(user) });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const checkUsername = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body || !body.username) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username: body.username },
            select: { id: true },
        });

        return res.status(200).json({ success: !user });
    } catch (err) {
        console.error(`[#] Error: ${err}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateProfilePicture = async (_req: Request, res: Response) => {
    profilePictureUpload.single("profile_photo")(_req, res, async (err) => {
        const req = _req as AuthenticatedUserRequest;
        if (err || !req.file) {
            console.error(`[#] ${err}`);
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        try {
            const pictureObj = await prisma.user.findUnique({
                where: { id: req.userId },
                select: { picture: true },
            });
            if (!pictureObj) return res.status(403).json({ success: false, message: "Forbidden" });

            await prisma.user.update({
                where: { id: req.userId },
                data: { picture: req.file.filename },
            });

            try {
                if (pictureObj.picture)
                    await fs.unlink(path.join(GET_PATH[FILE_SCOPE.PROFILE], pictureObj.picture));
            } catch (err) {
                console.error(
                    `Coulndn't find "${pictureObj.picture}" in profile images directory!`
                );
            }

            return res.status(200).json({
                success: true,
                message: "Updated successfully!",
                image: FORM_STATIC_URL(req.file.filename, FILE_SCOPE.PROFILE),
            });
        } catch (err) {
            console.error(`[#] ${err}`);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });
};

export const updateProfile = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            return res.status(403).json({ success: false, message: "Invalid id used for cookie" });
        }

        if (!req.body) {
            return res.status(400).json({ success: false, message: "Malformed body" });
        }

        const { username, email, name } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                username: username || user.username,
                email: email || user.email,
                name: name || user.name,
            },
        });

        return res.status(200).json({
            success: true,
            user: serializeUser(updatedUser),
            message: "Updated User successfully!",
        });
    } catch (err) {
        console.error(`[#] ${err}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const updateTheme = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body || req.body.theme === undefined)
        return res.status(400).json({ success: false, message: "Malformed body" });

    try {
        await prisma.user.update({
            where: { id: req.userId },
            data: { dark: req.body.theme },
        });

        return res.status(200).json({ success: true, message: "Updated Theme" });
    } catch (err) {
        console.error(`[#] ${err}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const removeProfilePicture = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;
    try {
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { picture: null },
        });

        if (!user) {
            return res.status(403).json({ success: false, message: "Invalid id used for cookie" });
        }

        return res.status(200).json({
            success: true,
            user: serializeUser(user),
            message: "Updated User successfully!",
        });
    } catch (err) {
        console.error(`[#] ${err}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getUserStatus = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body || !req.query.uid || typeof req.query.uid !== "string")
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.query.uid },
            select: { online: true, lastOnline: true },
        });

        if (!user)
            return res.status(403).json({ success: false, message: "Invalid id used for cookie" });

        return res.status(200).json({ success: true, message: "Fetched status", ...user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

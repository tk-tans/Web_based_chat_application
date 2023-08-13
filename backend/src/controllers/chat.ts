import { Request, Response } from "express";
import {
    AdminAuthenticatedUserRequest,
    AuthenticatedUserRequest,
    IOAuthenticatedUserRequest,
    MemberAuthenticatedRequest,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../prisma";

import { Member, Chat, Message } from "../types";
import {
    DISAPPEARING_TIME,
    FILE_SCOPE,
    FORM_STATIC_URL,
    GET_PATH,
    getChatFileName,
} from "../utils";
import { groupPictureUpload } from "../multer";

import * as fs from "fs/promises";
import path from "path";

const getMembersOfGroup = async (cid: string): Promise<Member[] | null> => {
    const members = await prisma.member.findMany({
        where: { AND: [{ cid: cid }, { removed: false }] },
        select: {
            user: {
                select: {
                    id: true,
                    username: true,
                    picture: true,
                },
            },
            admin: true,
        },
    });

    if (!members) return null;

    return members
        .map((member) => ({
            userId: member.user.id,
            username: member.user.username,
            picture: member.user.picture,
            admin: member.admin,
        }))
        .sort((a, b) => Number(b.admin) - Number(a.admin));
};

// Function to remove messages which are marked disappearing and
const updateMessageTable = async (cid: string): Promise<void> => {
    try {
        await prisma.message.deleteMany({
            where: {
                cid: cid,
                disappearing: true,
                createdAt: {
                    lte: new Date(Date.now() - DISAPPEARING_TIME),
                },
            },
        });
    } catch (err) {
        console.error(err);
        console.error(`For some reason chat with id: ${cid}, doesn't exist`);
    }
};

export const getChats = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    try {
        const chatRecords = await prisma.chat.findMany({
            where: { participants: { some: { uid: req.userId } } },
            orderBy: { lastMessage: "desc" },
            select: {
                id: true,
                dm: true,
                name: true,
                picture: true,
                lastMessage: true,
                disappearingMode: true,
            },
        });

        const promises: Promise<Chat>[] = chatRecords.map(async (chat) => {
            const members = await getMembersOfGroup(chat.id);

            if (!members) {
                throw "Could not find no members in the Chat";
            }

            if (chat.dm) {
                const otherMember = members.filter(({ userId }) => userId !== req.userId);

                if (otherMember.length === 1) {
                    chat.name = otherMember[0].username;
                    chat.picture = otherMember[0].picture;
                }
            }
            await updateMessageTable(chat.id);
            const messages = await prisma.message.findMany({
                where: { cid: chat.id },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    member: { select: { removed: true } },
                    user: {
                        select: {
                            id: true,
                            username: true,
                            picture: true,
                        },
                    },
                    content: true,
                    filePath: true,
                    createdAt: true,
                },
            });

            if (!messages) {
                throw "Could not find chat";
            }

            const sanitisedMessages: Message[] = messages.map((message) => {
                return {
                    id: message.id,
                    userId: message.user.id,
                    senderName: message.user.username,
                    senderPicture: message.user.picture,
                    createdAt: message.createdAt,
                    removed: message.member.removed,
                    content: message.content,
                    fileLink: FORM_STATIC_URL(message.filePath, FILE_SCOPE.CHAT_FILE),
                    fileName: message.filePath ? getChatFileName(message.filePath) : undefined,
                };
            });

            return { ...chat, messages: sanitisedMessages, members };
        });

        const chats: Chat[] = await Promise.all(promises);

        return res
            .status(200)
            .json({ success: true, message: `Found ${chats.length} chat(s)`, chats });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getMembers = async (req: Request, res: Response) => {
    const { cid } = req.query;

    if (!cid || typeof cid !== "string")
        return res.status(400).json({ success: false, message: "Malformed Query" });

    try {
        const members = await getMembersOfGroup(cid);

        if (!members)
            return res
                .status(403)
                .json({ success: false, message: "Chat with that cid doesn't exist" });

        return res
            .status(200)
            .json({ success: true, message: `Found ${members.length} members`, members });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

interface SerialisedMember {
    userId: string;
    username: string;
    picture: string | null;
}
const createMember = async (
    userIdentification: string,
    chatId: string,
    admin: boolean,
    identificationAsId: boolean = false
): Promise<SerialisedMember | null> => {
    try {
        const user = await prisma.user.findUnique({
            where: identificationAsId
                ? { id: userIdentification }
                : { username: userIdentification },
            select: { id: true, username: true, picture: true },
        });
        if (!user) return null;

        await prisma.member.upsert({
            where: { uid_cid: { uid: user.id, cid: chatId } },
            create: {
                uid: user.id,
                cid: chatId,
                removed: false,
                admin,
                lastSeen: new Date(0),
            },
            update: { removed: false },
        });

        return {
            userId: user.id,
            username: user.username,
            picture: user.picture,
        };
    } catch (err) {
        return null;
    }
};

export const createDM = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body) {
        return res.status(400).json({ success: false, message: "Malformed Body" });
    }

    const { username } = req.body;

    if (!username) return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        // Check if username is of the same person as the one creating the DM
        const requestingUser = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { username: true },
        });
        if (!requestingUser)
            return res
                .status(403)
                .json({ success: false, message: "User with that Id doesn't exist" });

        if (username === requestingUser.username)
            return res
                .status(403)
                .json({ success: false, message: "Can't make a DM with same user" });

        const chat = await prisma.chat.create({
            data: {
                id: uuidv4(),
                dm: true,
                lastMessage: new Date(),
                disappearingMode: false,
            },
        });

        const userOne = await createMember(req.userId, chat.id, false, true);
        const userTwo = await createMember(username, chat.id, false);

        if (!userOne || !userTwo) {
            return res
                .status(403)
                .json({ success: false, message: "User with that Id doesn't exist" });
        }

        const io = (_req as IOAuthenticatedUserRequest).io;

        io.in(`user-${userOne.userId}`).socketsJoin(`chat-${chat.id}`);
        io.in(`user-${userTwo.userId}`).socketsJoin(`chat-${chat.id}`);

        const chatForOne: Chat = {
            id: chat.id,
            dm: true,
            name: userTwo.username,
            picture: userTwo.picture,
            lastMessage: new Date(),
            disappearingMode: false,
            messages: [],
            members: [
                {
                    ...userOne,
                    admin: true,
                },
                {
                    ...userTwo,
                    admin: true,
                },
            ],
        };

        // TODO: socket send to the second USER
        const chatForTwo: Chat = {
            ...chatForOne,
            name: userOne.username,
            picture: userOne.picture,
        };

        io.to(`user-${userTwo.userId}`).emit("group:join", chatForTwo);

        return res.status(200).json({ success: true, message: "Create new DM", chat: chatForOne });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

interface AddableMember {
    username: string;
    admin: boolean;
}
export const createGroup = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body) {
        return res.status(400).json({ success: false, message: "Malformed Body" });
    }

    const { members, groupName } = req.body;

    if (!members || !(members instanceof Object) || !groupName)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const chat = await prisma.chat.create({
            data: {
                id: uuidv4(),
                dm: false,
                lastMessage: new Date(),
                name: groupName,
                disappearingMode: false,
            },
        });

        const promises: Promise<SerialisedMember | null>[] = [
            createMember(req.userId, chat.id, true, true),
            ...members.map((member: AddableMember) => {
                return createMember(member.username, chat.id, member.admin);
            }),
        ];

        const serialisedMembers = (await Promise.all(promises)).filter((x) => !!x);

        if (serialisedMembers.includes(null)) {
            return res
                .status(400)
                .json({ success: false, message: "User with that Id doesn't exist" });
        }

        const io = (_req as IOAuthenticatedUserRequest).io;

        serialisedMembers.forEach((member) => {
            if (!member) return;

            io.to(`user-${member.userId}`).socketsJoin(`chat-${chat.id}`);
        });

        const serialisedChat: Chat = {
            id: chat.id,
            dm: false,
            name: chat.name,
            picture: null,
            lastMessage: new Date(),
            disappearingMode: chat.disappearingMode,
            messages: [],
            members: serialisedMembers.map((member) => ({
                userId: member!.userId,
                picture: member!.picture,
                username: member!.username,
                admin: false,
            })),
        };

        io.to(`chat-${chat.id}`).emit("group:join", serialisedChat);

        return res.status(200).json({ success: true, message: "Create new Group" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const recordMessage = async (_req: Request, res: Response) => {
    const req = _req as MemberAuthenticatedRequest;

    if (!req.body || !req.body.cid) {
        if (req.file) await fs.unlink(req.file?.path);
        return res.status(400).json({ success: false, message: "Malformed Body" });
    }

    req.chatId = req.body.cid;

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: req.chatId },
            select: { disappearingMode: true },
        });

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { username: true, picture: true },
        });

        if (!chat || !user) {
            if (req.file) await fs.unlink(req.file?.path);
            return res.status(403).json({ success: false, message: "Invalid Chat or User" });
        }

        const messageObj = await prisma.message.create({
            data: {
                id: uuidv4(),
                uid: req.userId,
                cid: req.chatId,
                disappearing: chat.disappearingMode,
                content: req.body.content || null,
                filePath: req.file?.filename || null,
            },
        });

        const message: Message = {
            id: messageObj.id,
            userId: messageObj.uid,
            content: messageObj.content,
            fileLink: FORM_STATIC_URL(messageObj.filePath, FILE_SCOPE.CHAT_FILE),
            fileName: messageObj.filePath ? getChatFileName(messageObj.filePath) : undefined,
            senderName: user.username,
            senderPicture: user.picture,
            removed: false,
            createdAt: messageObj.createdAt,
        };

        // TODO: Send to all in the room
        const io = (_req as IOAuthenticatedUserRequest).io;
        io.to(`chat-${req.chatId}`).emit("message:transfer", req.chatId, message);

        return res
            .status(200)
            .json({ success: true, message: "Message Recorded!", userMessage: message });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const deleteMessage = async (_req: Request, res: Response) => {
    const req = _req as MemberAuthenticatedRequest;

    if (!req.body || !req.body.messageId)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const message = await prisma.message.findUnique({
            where: { id: req.body.messageId },
            select: { filePath: true, uid: true, cid: true },
        });

        if (!message || req.userId !== message.uid || req.chatId !== message.cid)
            return res
                .status(403)
                .json({ success: false, message: "Not permitted to delete image" });

        await prisma.message.delete({
            where: { id: req.body.messageId },
        });

        // TODO: Send message to everyone in that chat that message with mid has been deleted

        return res.status(200).json({ success: true, message: "Deleted message!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const downloadChat = async (_req: Request, res: Response) => {
    const req = _req as MemberAuthenticatedRequest;

    try {
        await updateMessageTable(req.chatId);
        const messages = await prisma.message.findMany({
            where: { cid: req.chatId },
            orderBy: { createdAt: "asc" },
            select: {
                content: true,
                createdAt: true,
                user: { select: { username: true } },
            },
        });

        const content = messages
            .map((message) => {
                return `[${message.createdAt.toLocaleString()}] ${message.user.username}: ${
                    message.content ? message.content : "<File Sent>"
                }`;
            })
            .join("\n");

        const pathname = path.join(
            GET_PATH[FILE_SCOPE.TEMP],
            `chat-messages-${req.chatId}-${Math.floor(Math.random() * 1e9)}.txt`
        );

        await fs.writeFile(pathname, content);

        setTimeout(async () => {
            await fs.unlink(pathname);
        }, 5 * 60 * 1000); // 5 minutes

        return res.download(pathname);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const addGroupMember = async (_req: Request, res: Response) => {
    const req = _req as AdminAuthenticatedUserRequest;

    if (!req.body.username)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        await createMember(req.body.username, req.chatId, false);

        const members = await getMembersOfGroup(req.chatId);

        if (!members) return res.status(403).json({ success: false, message: "Some random error" });

        return res
            .status(200)
            .json({ success: false, message: `Found ${members.length} member(s)`, members });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const leaveGroup = async (_req: Request, res: Response) => {
    const req = _req as IOAuthenticatedUserRequest;

    if (!req.body.cid) return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        await prisma.member.update({
            where: { uid_cid: { uid: req.userId, cid: req.body.cid } },
            data: { removed: true },
        });

        // Socket stuff
        req.io.in(`user-${req.userId}`).socketsLeave(`chat-${req.body.cid}`);
        // TODO: send message to all members of the chat

        return res.status(200).json({ success: true, message: "Left the group" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateGroupName = async (_req: Request, res: Response) => {
    const req = _req as AdminAuthenticatedUserRequest;

    if (!req.body) return res.status(400).json({ success: false, message: "Malformed Body" });

    const { name } = req.body;

    if (!name) return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: req.chatId },
            select: { dm: true },
        });
        if (!chat || chat.dm) return res.status(403).json({ success: false, message: "Forbidden" });

        await prisma.chat.update({
            where: { id: req.chatId },
            data: { name },
        });

        // TODO: Socket send a message to everyone
    } catch (err) {
        console.error(err);
    }
};

export const updateGroupMode = async (_req: Request, res: Response) => {
    const req = _req as AdminAuthenticatedUserRequest;

    if (!req.body) return res.status(400).json({ success: false, message: "Malformed Body" });

    const { disappearingMode } = req.body;

    if (disappearingMode === undefined)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: req.chatId },
            select: { dm: true },
        });
        if (!chat || chat.dm) return res.status(403).json({ success: false, message: "Forbidden" });

        await prisma.chat.update({
            where: { id: req.chatId },
            data: { disappearingMode },
        });
        const io = (_req as IOAuthenticatedUserRequest).io;
        // TODO: Socket send a message to everyone
        io.to(`chat-${req.chatId}`).emit("group:mode", disappearingMode);

        return res.status(200).json({ success: true, message: "Updated mode" });
    } catch (err) {
        console.error(err);
    }
};

export const updateGroupPhoto = (_req: Request, res: Response) => {
    groupPictureUpload.single("group_photo")(_req, res, async (err) => {
        if (err || !_req.file) {
            console.error(`[#] ${err}`);
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        console.log(_req.file);

        if (!_req.body.cid) {
            try {
                await fs.unlink(path.join(GET_PATH[FILE_SCOPE.GROUP_PROFILE], _req.file.filename));
            } catch (err) {
                console.error(err);
            }
            return res.status(400).json({ success: false, message: "Malformed Body" });
        }

        const req = _req as AdminAuthenticatedUserRequest;
        req.chatId = _req.body.cid;

        if (err || !req.file) {
            console.error(`[#] ${err}`);
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        try {
            const user = await prisma.member.findUnique({
                where: { uid_cid: { uid: req.userId, cid: req.chatId } },
                select: { admin: true },
            });
            if (!user || !user.admin) {
                return res.status(403).json({ success: false, message: "Permission Denied" });
            }
        } catch (err) {
            return res.status(403).json({ success: false, message: "Permission Denied" });
        }

        try {
            const pictureObj = await prisma.chat.findUnique({
                where: { id: req.chatId },
                select: { picture: true },
            });
            if (!pictureObj) return res.status(403).json({ success: false, message: "Forbidden" });

            const IMAGE_URL = FORM_STATIC_URL(req.file.filename, FILE_SCOPE.GROUP_PROFILE);
            await prisma.chat.update({
                where: { id: req.chatId },
                data: { picture: IMAGE_URL },
            });

            try {
                if (pictureObj.picture)
                    await fs.unlink(
                        path.join(GET_PATH[FILE_SCOPE.GROUP_PROFILE], pictureObj.picture)
                    );
            } catch (err) {
                console.error(`Couldn't find "${pictureObj.picture}" in profile images directory!`);
            }

            const io = (_req as IOAuthenticatedUserRequest).io;
            io.to(`chat-${req.chatId}`).emit("group:picture_change", IMAGE_URL);

            return res.status(200).json({
                success: true,
                message: "Updated successfully!",
                image: IMAGE_URL,
            });
        } catch (err) {
            console.error(`[#] ${err}`);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });
};

export const removeGroupMember = async (_req: Request, res: Response) => {
    const req = _req as IOAuthenticatedUserRequest;

    try {
        await prisma.member.update({
            where: { uid_cid: { uid: req.body.uid, cid: req.body.cid } },
            data: { removed: true },
        });

        // Socket Stuff
        req.io.in(`user-${req.body.uid}`).socketsLeave(`chat-${req.body.cid}`);
        // TODO: send message to all members of the chat

        const members = await getMembersOfGroup(req.body.cid);

        if (!members) return res.status(403).json({ success: false, message: "Some random error" });

        return res
            .status(200)
            .json({ success: true, message: `Found ${members.length} member(s)`, members });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const toggleAdminStatus = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body.uid || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const memberAdminStatus = await prisma.member.findUnique({
            where: { uid_cid: { uid: req.body.uid, cid: req.body.cid } },
            select: { admin: true },
        });

        if (!memberAdminStatus)
            return res
                .status(403)
                .json({ success: false, message: "Member with that Id doesn't exist" });

        await prisma.member.update({
            where: { uid_cid: { uid: req.body.uid, cid: req.body.cid } },
            data: {
                admin: !memberAdminStatus,
            },
        });

        const members = await getMembersOfGroup(req.body.cid);

        if (!members)
            return res
                .status(403)
                .json({ success: false, message: "Member with that Id doesn't exist" });

        return res
            .status(200)
            .json({ success: true, message: `Found ${members.length} member(s)`, members });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

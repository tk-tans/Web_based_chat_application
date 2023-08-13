import { Server, Socket } from "socket.io";
import { AuthenticatedUserSocket } from "./types";
import { prisma } from "./prisma";

const handleSocketConnection = (io: Server) => async (_socket: Socket) => {
    const socket = _socket as AuthenticatedUserSocket;
    console.log(`Socket connected with userID: ${socket.userId}, socketID: ${socket.id}`);

    try {
        const user = await prisma.user.findUnique({ where: { id: socket.userId } });

        if (!user) throw "INVALID USER";

        const updatedUser = await prisma.user.update({
            where: { id: socket.userId },
            data: {
                online: true,
                devicesOnline: user.devicesOnline + 1,
            },
            select: {
                id: true,
                online: true,
                devicesOnline: true,
                lastOnline: true,
            },
        });

        if (updatedUser.devicesOnline === 1) {
            const chats = await prisma.chat.findMany({
                where: { dm: true, participants: { some: { uid: socket.userId } } },
                select: { id: true },
            });

            chats.forEach(({ id }) => {
                io.to(`chat-${id}`).emit("status:update", updatedUser);
            });
        }
    } catch (err) {
        console.error("Socket connected with invalid user ID");
    }

    const chats = await prisma.chat.findMany({
        where: { participants: { some: { uid: socket.userId } } },
        select: { id: true },
    });

    chats.forEach(({ id }) => {
        socket.join(`chat-${id}`);
    });

    socket.join(`user-${socket.userId}`);

    socket.on("disconnect", async () => {
        console.log(`DISCONNECT: ${socket.id}`);
        try {
            const user = await prisma.user.findUnique({ where: { id: socket.userId } });

            if (!user) throw "INVALID USER";

            const updatedUser = await prisma.user.update({
                where: { id: socket.userId },
                data: {
                    online: user.devicesOnline > 1,
                    devicesOnline: user.devicesOnline - 1,
                    lastOnline: new Date(),
                },
                select: {
                    online: true,
                    lastOnline: true,
                    id: true,
                },
            });

            if (user.devicesOnline === 1) {
                const DMs = await prisma.chat.findMany({
                    where: {
                        dm: true,
                        participants: {
                            some: { uid: socket.userId },
                        },
                    },
                    select: {
                        participants: { select: { uid: true } },
                    },
                });

                DMs.forEach((dm) => {
                    dm.participants.forEach(({ uid }) => {
                        if (uid === socket.userId) return;

                        io.to(`user-${uid}`).emit("status:update", updatedUser);
                    });
                });
            }
        } catch (err) {
            console.error("Socket connected with invalid user ID");
        }
    });
};

export default handleSocketConnection;

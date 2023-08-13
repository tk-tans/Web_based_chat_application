import express, { Express } from "express";
import { Server } from "socket.io";
import { createServer } from "http";

import cookieParser from "cookie-parser";
import cors from "cors";

import { CLIENT_URL, LOCAL_NETWORK_CLIENT_URL } from "./config/config";

import authenticationRouter from "./routers/authentication";
import chatRouter from "./routers/chat";

import path from "path";
import { socketAuthorization } from "./middlewares/authentication";
import handleSocketConnection from "./socket";
import { populateReqWithIO } from "./middlewares/io";

const app: Express = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: [CLIENT_URL, LOCAL_NETWORK_CLIENT_URL],
        credentials: true,
    },
    cookie: true,
});
io.use(socketAuthorization);
io.on("connection", handleSocketConnection(io));

// ----------MIDDLEWARES-----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
// CORS
app.use(
    cors({
        origin: [CLIENT_URL, LOCAL_NETWORK_CLIENT_URL],
        credentials: true,
    })
);
//Kinda sus
app.use(populateReqWithIO(io));

app.use(express.static(path.join("public")));

app.use("/auth", authenticationRouter);
app.use("/chat", chatRouter);

export default httpServer;

import { NextFunction, Request, Response } from "express";
import { Server } from "socket.io";
import { IOAuthenticatedUserRequest } from "../types";

export const populateReqWithIO =
    (io: Server) => (req: Request, _: Response, next: NextFunction) => {
        (req as IOAuthenticatedUserRequest).io = io;
        next();
    };

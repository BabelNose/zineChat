import { Session } from "express-session";
import { Request } from "express";
import { User } from "../users/user.entity.js";

export type ZineSession = Session & {
    refreshToken: string;
    accessToken: string;
    userId: string;
}

export type ZineRequest = Request & {
    user: User,
    session: ZineSession
}
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

// JwtStrategy only resolves { userId }, unlike LocalAuthGuard which resolves the full User onto req.user
export type JwtAuthenticatedRequest = Request & {
    user: { userId: string },
    session: ZineSession
}
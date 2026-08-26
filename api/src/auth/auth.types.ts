import { Session } from "express-session";

export type ZineSession = Session & {
    refreshToken: string;
    accessToken: string;
    userId: string;
}

export type ZineRequest = Request & {
    session: ZineSession
}
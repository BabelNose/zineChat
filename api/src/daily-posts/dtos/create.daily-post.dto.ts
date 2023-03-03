import { ObjectId } from "mongodb";

export interface CreateDailyPostDto {
    userId: ObjectId;
    text: string;
    title?: string;
    timestamp: Date;
}
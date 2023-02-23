import { ObjectId } from "mongodb";

export interface PutDailyPostDto {
    userId: ObjectId;
    text: string;
    title: string;
    timestamp: Date;
}
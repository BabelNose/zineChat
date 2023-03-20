import { TopicStatus } from "../enums/daily-post.status.enum";
import { User } from "./user.model";

export interface DailyPost {
    id:string;
    title: string;
    text: string;
    timestamp: Date;
    topicId:string;
    userId:User;
  }

export interface CreateDailyPost {
  title: string;
  text: string;
  topicId:string;
}

export interface Topic {
  id:string;
  startDate: Date;
  endDate?: Date;
  status:TopicStatus;
  text:string;
}
import { TopicStatus } from "../enums/daily-posts.topic-status.enum";

export interface PutTopicDto {
    text: String,
    start: Date,
    end: Date,
    status:TopicStatus
}
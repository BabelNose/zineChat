import { TopicStatus } from "../enums/daily-posts.topic-status.enum";

export interface CreateTopicDto {
    text: String,
    startDate: Date,
    endDate?: Date,
    status?:TopicStatus
}
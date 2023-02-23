
import { CreateTopicDto } from '../dtos/create.topic.dto';
import { PutTopicDto } from '../dtos/put.topic.dto';
import { PatchTopicDto } from '../dtos/patch.topic.dto';
import mongooseService from '../../common/services/mongoose.service';
import debug from 'debug';
import { TopicStatus } from '../enums/daily-posts.topic-status.enum';

const log: debug.IDebugger = debug('app:topics-dao');

class TopicsDao {
    Schema = mongooseService.getMongoose().Schema;
    TopicsSchema = new this.Schema({
        text: String,
        startDate: Date,
        endDate: Date,
        status: {type:Number, enum:TopicStatus, default:TopicStatus.INACTIVE}
    }
    ,{
    'toJSON': {
        virtuals: true,
        versionKey:false,
        transform: (doc, ret) => {
            log(ret);
            delete ret._id
        }
    }
    });

    Topic = mongooseService.getMongoose().model('Topics', this.TopicsSchema);

    constructor() {
        log('Created new instance of TopicsDao');
    }

    async addTopic(TopicFields: CreateTopicDto) {
        const topic = new this.Topic({
            ...TopicFields,
        });
        const response = await topic.save();
        return response.id;
    }
    
    async getTopicById(topicId: string) {
        return this.Topic.findById(topicId).exec();
    }
    
    async getTopics(limit = 25, page = 0) {
        return this.Topic.find({})
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    async updateTopicById(
        topicId: string,
        topicFields: PatchTopicDto | PutTopicDto
    ) {
        const existingPost = await this.Topic.findOneAndUpdate(
            { _id: topicId },
            { $set: topicFields },
            { new: true }
        ).exec();
    
        return existingPost;
    }

    async removeTopicById(topicId: string) {
        return this.Topic.deleteOne({ _id: topicId }).exec();
    }
}

export default new TopicsDao();
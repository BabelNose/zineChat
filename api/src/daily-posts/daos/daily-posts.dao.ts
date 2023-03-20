
import { CreateDailyPostDto } from '../dtos/create.daily-post.dto';
import { PutDailyPostDto } from '../dtos/put.daily-post.dto';
import { PatchDailyPostDto } from '../dtos/patch.daily-post.dto';
import { ObjectId } from 'mongodb';
import mongooseService from '../../common/services/mongoose.service';
import debug from 'debug';

const log: debug.IDebugger = debug('app:daily-posts-dao');

class DailyPostsDao {
    private Schema = mongooseService.getMongoose().Schema;
    private DailyPostsSchema = new this.Schema({
        userId: {type: ObjectId, ref: 'Users'},
        topicId: {type: ObjectId, ref: 'Topics'},
        title: String,
        text: String,
        timestamp: Date,
    }
    ,{
        timeseries: {
            timeField: 'timestamp',
            granularity: 'hours'
        },
        'toJSON': {
            virtuals: true,
            versionKey:false,
            transform: (doc, ret) => {
                log(ret);
                delete ret._id
            }
        }
    });

    private DailyPost = mongooseService.getMongoose().model('DailyPosts', this.DailyPostsSchema);

    private UserPopulationFields = 'id username email';

    constructor() {
        log('Created new instance of DailyPostsDao');
    }

    async addDailyPost(dailyPostFields: CreateDailyPostDto) {
        const dailyPost = new this.DailyPost({
            ...dailyPostFields,
        });
        const response = await dailyPost.save();
        return response.id;
    }
    
    async getDailyPostById(postId: string) {
        return this.DailyPost.findById(postId).populate('userId', this.UserPopulationFields).exec();
    }
    
    async getDailyPosts(limit = 25, page = 0) {
        return this.DailyPost.find({})
            .populate('userId', this.UserPopulationFields)
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    async getDailyPostsByTopic(topicId:string, limit = 25, page = 0) {
        return this.DailyPost.find({topicId: topicId})
            .populate('userId', this.UserPopulationFields)
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    async updateDailyPostById(
        postId: string,
        postFields: PatchDailyPostDto | PutDailyPostDto
    ) {
        const existingPost = await this.DailyPost.findOneAndUpdate(
            { _id: postId },
            { $set: postFields },
            { new: true }
        ).exec();
    
        return existingPost;
    }

    async removePostById(postId: string) {
        return this.DailyPost.deleteOne({ _id: postId }).exec();
    }
}

export default new DailyPostsDao();
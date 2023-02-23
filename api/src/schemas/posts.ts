import mongoose from 'mongoose';
const { Schema } = mongoose;

export const postsSchema = new Schema(
    {
        userId: mongoose.Types.ObjectId,
        content: String,
        timestamp: Date,
    }
    ,{
        timeseries: {
            timeField: 'timestamp',
            granularity: 'hours'
        },
        methods: {
            // findTimelinePosts(cb) {
            //   return mongoose.model('Posts').find({timestamp: {$lt: Date()}}, cb);
            // }
          }
    }
);
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const likesSchema = new Schema(
    {
        userId: mongoose.Types.ObjectId,
        postId: mongoose.Types.ObjectId,
        timestamp: Date,
    },{
        timeseries: {
            timeField: 'timestamp',
            granularity: 'hours'
        }
    }
);
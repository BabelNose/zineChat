import mongoose from 'mongoose';
const { Schema } = mongoose;

export const likesSchema = new Schema(
    {
        user_id: mongoose.Types.ObjectId,
        post_id: mongoose.Types.ObjectId,
        timestamp: Date,
    },{
        timeseries: {
            timeField: 'timestamp',
            granularity: 'hours'
        }
    }
);
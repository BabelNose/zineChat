import mongoose from 'mongoose';
const { Schema } = mongoose;

const postsSchema = new Schema(
    {
        user_id: mongoose.Types.ObjectId,
        content: String,
        timestamp: Date,
    }
    ,{
        timeseries: {
            timeField: 'timestamp',
            granularity: 'hours'
        }
    }
);
import mongoose from 'mongoose';
import debug from 'debug';
import { connectionString } from '../config/connectionString';

const log: debug.IDebugger = debug('app:mongoose-service');

class MongooseService {
    private count = 0;
    private mongooseOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 50000,
    };

    constructor() {
        this.connectWithRetry();
    }

    getMongoose() {
        return mongoose;
    }

    connectWithRetry = () => {
        if (process.env.NODE_ENV !== 'test') {
            log('Attempting MongoDB connection (will retry if needed)');
            mongoose
                .connect(connectionString, this.mongooseOptions)
                .then(() => {
                    log('MongoDB is connected');
                })
                .catch((err) => {
                    const retrySeconds = 5;
                    log(
                        `MongoDB connection unsuccessful (will retry #${++this
                            .count} after ${retrySeconds} seconds):`,
                        err
                    );
                    setTimeout(this.connectWithRetry, retrySeconds * 1000);
                });
        }else{
            log('Test mode activated. Please connect to Mongoose manually');
        }
    };
}
export default new MongooseService();
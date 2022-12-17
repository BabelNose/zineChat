import config from '../config/config';
import mongoose from 'mongoose';

export const mongooseConnection = (): mongoose.Connection => {
    const client:mongoose.Connection = mongoose.createConnection(`mongodb://${config.MONGODB_USER}:${config.MONGODB_PASS}@${config.MONGODB_HOST}${config.MONGODB_PORT}/${config.MONGODB_DB_NAME}`);
    return client;
 }
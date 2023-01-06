import config from '../common/config/config';
import mongoose from 'mongoose';

export const mongooseConnection = (): mongoose.Connection => {
    const client:mongoose.Connection = mongoose.createConnection(
        `mongodb://${config.MONGODB_USER}:${config.MONGODB_PASS}@${config.MONGODB_HOST}:${config.MONGODB_PORT}/${config.MONGODB_DB_NAME}?authSource=${config.MONGODB_AUTH_DB}`
        ).on('error',function (err) {  
            console.log('Mongoose default connection error: ' + err);
      }); 
      ;
    return client;
 }
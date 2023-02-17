import mongoose from 'mongoose';
import { connectionString } from './connectionString';

export const mongooseConnection = (): mongoose.Connection => {
    const client:mongoose.Connection = mongoose.createConnection(
        connectionString
        ).on('error',function (err) {  
            console.log('Mongoose default connection error: ' + err);
      }); 
      ;
    return client;
 }
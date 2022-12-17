import mongoDB from 'mongodb';
import config from '../config/config';

export const mongodb = async (): Promise<mongoDB.Db> => {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(`mongodb://${config.MONGODB_USER}:${config.MONGODB_PASS}@${config.MONGODB_HOST}${config.MONGODB_PORT}/${config.MONGODB_DB_NAME}`);
    try{
        await client.connect();
    }catch{(error:Error) => {
        throw new Error(`There was an error connection to database: ${error}`);
    }}
    const db: mongoDB.Db = client.db(config.MONGODB_DB_NAME);
    return db;
 }
import config from '../common/config/config';

export const connectionString:string = `mongodb://${config.MONGODB_USER}:${config.MONGODB_PASS}@${config.MONGODB_HOST}:${config.MONGODB_PORT}/${config.MONGODB_DB_NAME}?authSource=${config.MONGODB_AUTH_DB}`;
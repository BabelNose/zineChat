import {rabbitmq} from './rabbitmq';
import {mongooseConnection} from './mongoose';

export const mq = rabbitmq();
export const orm = mongooseConnection();
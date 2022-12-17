import {rabbitmq} from './rabbitmq';
import {mongodb} from './mongodb';
import {mongooseConnection} from './mongoose';

export const mq = rabbitmq();
export const db = mongodb();
export const orm = mongooseConnection();
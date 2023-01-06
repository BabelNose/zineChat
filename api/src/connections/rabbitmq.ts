import * as amqp from 'amqplib';
import config from '../common/config/config';

export const rabbitmq = async ():Promise<amqp.Connection> => {
    const connection = await amqp.connect(`${config.RABBITMQ_HOST}:${config.RABBITMQ_PORT}`);
    return connection;
}
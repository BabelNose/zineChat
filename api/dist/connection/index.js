"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rabbitmq_1 = require("./rabbitmq");
const mongodb_1 = require("./mongodb");
module.exports = {
    mq: rabbitmq_1.rabbitmq,
    dq: mongodb_1.mongodb
};

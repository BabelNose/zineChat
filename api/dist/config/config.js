"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../config/config.env") });
// Loading process.env as ENV interface
const getConfig = () => {
    return {
        MONGODB_HOST: process.env.MONGODB_HOST,
        MONGODB_PORT: process.env.MONGODB_PORT ? Number(process.env.MONGODB_PORT) : undefined,
        RABBITMQ_HOST: process.env.RABBITMQ_HOST,
        RABBITMQ_PORT: process.env.RABBITMQ_PORT ? Number(process.env.RABBITMQ_PORT) : undefined,
        MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    };
};
// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.
const getSanitzedConfig = (config) => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in config.env`);
        }
    }
    return config;
};
const config = getConfig();
const sanitizedConfig = getSanitzedConfig(config);
exports.default = sanitizedConfig;

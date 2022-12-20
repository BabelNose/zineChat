import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: 'src/config/config.env' });

interface ENV {
    MONGODB_HOST: string | undefined;
    MONGODB_PORT: number | undefined;
    RABBITMQ_HOST: string | undefined;
    RABBITMQ_PORT: number | undefined;
    MONGODB_AUTH_DB: string | undefined;
    MONGODB_USER: string | undefined;
    MONGODB_PASS: string | undefined;
    MONGODB_DB_NAME: string | undefined;
}

interface Config {
    MONGODB_HOST: string;
    MONGODB_PORT: number;
    RABBITMQ_HOST: string;
    RABBITMQ_PORT: number;
    MONGODB_AUTH_DB: string;
    MONGODB_DB_NAME: string;
    MONGODB_USER: string;
    MONGODB_PASS: string;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    MONGODB_HOST: process.env.MONGODB_HOST,
    MONGODB_PORT: process.env.MONGODB_PORT ? Number(process.env.MONGODB_PORT) : undefined,
    RABBITMQ_HOST: process.env.RABBITMQ_HOST,
    RABBITMQ_PORT: process.env.RABBITMQ_PORT ? Number(process.env.RABBITMQ_PORT) : undefined,
    MONGODB_AUTH_DB: process.env.MONGODB_AUTH_DB,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    MONGODB_USER: process.env.MONGODB_USER,
    MONGODB_PASS: process.env.MONGODB_PASS,
  };
};

// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitzedConfig(config);

export default sanitizedConfig;
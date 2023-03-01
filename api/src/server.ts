import express from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import {CommonRoutesConfig} from './common/common.routes.config';
import config from './common/config/config';
import {UsersRoutes} from './users/users.routes.config';
import cors from 'cors';
import debug from 'debug';
import { AuthRoutes } from './auth/auth.routes.config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { csrfSync } from "csrf-sync";
import CsrfErrorHandler from './common/middlewares/common.csrf-error-handler.middleware';
import { DailyPostsRoutes } from './daily-posts/daily-posts.routes.config';
import { TopicsRoutes } from './daily-posts/topics.routes.config';
import mongooseService from './common/services/mongoose.service';

function createServer() {
  const app = express();
  const routes: Array<CommonRoutesConfig> = [];
  const {csrfSynchronisedProtection} = csrfSync();
  const MongooseConnection = mongooseService.getMongoose().connection

  //TODO dump this in env and set it up for multiple origins
  const corsConfig = {
    origin:'http://localhost:4200',
    credentials:true
  }

  app.use(express.json());
  app.use(cors(corsConfig));
  app.use(helmet());
  app.use(session({
    secret: config.SESSION_SECRET,
    store: MongoStore.create({client: MongooseConnection.getClient()})
  }));
  app.use(cookieParser());
  app.use(csrfSynchronisedProtection);
  app.use(CsrfErrorHandler.handleCsrfError);

  // here we are preparing the expressWinston logging middleware configuration,
  // which will automatically log all HTTP requests handled by Express.js
  const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true })
    ),
  };

  if (!process.env.DEBUG) {
    loggerOptions.meta = false; // when not debugging, log requests as one-liners
    if(typeof global.it === "function"){
      loggerOptions.level = 'http'; // for non-debug test runs, squelch entirely
    }
  }
  app.use(expressWinston.logger(loggerOptions));

  // Important Routes need to be defined after the logger (expressWinston)
  // here we are adding the UserRoutes to our array,
  // after sending the Express.js application object to have the routes added to our app!
  //TODO Put all the route into a seperate file
  routes.push(new UsersRoutes(app));
  routes.push(new AuthRoutes(app));
  routes.push(new DailyPostsRoutes(app));
  routes.push(new TopicsRoutes(app));
  
  return app
}

export default createServer
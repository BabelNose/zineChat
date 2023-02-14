import express from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import {CommonRoutesConfig} from './common/common.routes.config';
import {UsersRoutes} from './users/users.routes.config';
import cors from 'cors';
import debug from 'debug';
import { AuthRoutes } from './auth/auth.routes.config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = express();
const routes: Array<CommonRoutesConfig> = [];
const debugLog: debug.IDebugger = debug('app');

const corsConfig = {
  origin:'http://localhost:4200',
  credentials:true
}

app.use(express.json());
app.use(cors(corsConfig));
app.use(helmet());
app.use(cookieParser());

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
routes.push(new UsersRoutes(app));
routes.push(new AuthRoutes(app));

  
const server = app.listen(3000, () => {
  routes.forEach((route: CommonRoutesConfig) => {
    debugLog(`Routes configured for ${route.getName()}`);
  });
  debugLog('listening on *:3000');
});

export default server;
import { CommonRoutesConfig } from '../common/common.routes.config';
import authController from './controllers/auth.controller';
import authMiddleware from './middlewares/auth.middleware';
import express from 'express';
import BodyValidationMiddleware from '../common/middlewares/body.validation.middleware';
import { body } from 'express-validator';
import jwtMiddleware from './middlewares/jwt.middleware';

export class AuthRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'AuthRoutes');
    }

    configureRoutes(): express.Application {
        this.app.get(`/auth`, [
            authController.createCSRF
        ]);

        this.app.post(`/auth`, [
            body('email').isEmail(),
            body('password').isString(),
            BodyValidationMiddleware.verifyBodyFieldsErrors,
            authMiddleware.verifyUserPassword,
            authController.createJWT,
        ]);
        
        this.app.post(`/auth/refresh-token`, [
            jwtMiddleware.verifyRefreshCookie,
            jwtMiddleware.validRefreshNeeded,
            authController.createJWT,
        ]);
        return this.app;
    }
}
import express from 'express';
import { body } from 'express-validator';
import { CommonRoutesConfig } from '../common/common.routes.config';
import DailyPostsController from './controllers/daily-posts.controller';
import DailyPostsMiddleware from './middleware/daily-posts.middleware';
import jwtMiddleware from '../auth/middlewares/jwt.middleware';
import BodyValidationMiddleware from '../common/middlewares/body.validation.middleware';
import topicsMiddleware from './middleware/topics.middleware';

export class DailyPostsRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'DailyPostsRoutes');
    }

    configureRoutes(): express.Application {
        this.app
            .route(`/daily-posts`)
            .get(
                jwtMiddleware.validJWTNeeded,
                DailyPostsController.listDailyPosts
            )
            .post(
                jwtMiddleware.validJWTNeeded,
                body('text').isString(),
                body('topicId').isString(),
                body('title').isString().optional(),
                BodyValidationMiddleware.verifyBodyFieldsErrors,
                BodyValidationMiddleware.extractMatchedBodyData,
                topicsMiddleware.validateTopicExists,
                DailyPostsController.createDailyPost
            );

        this.app.param(`postId`, DailyPostsMiddleware.extractPostId);
        this.app
            .route(`/daily-posts/:postId`)
            .all(
                jwtMiddleware.validJWTNeeded,
                DailyPostsMiddleware.validatePostExists,
            )
            .get(DailyPostsController.getDailyPostById)
            //Not allowed on TimeSeries Collection
            // .delete(
            //     DailyPostsMiddleware.validateDailyPostBelongsToUser,
            //     DailyPostsController.removeDailyPost
            // );
        //Not allowed on TimeSeries Collection
        // this.app.patch(`/daily-posts/:postId`, [
        //     jwtMiddleware.validJWTNeeded,
        //     body('postId').isString().optional(),
        //     body('text').isString().optional(),
        //     body('title').isString().optional(),
        //     BodyValidationMiddleware.verifyBodyFieldsErrors,
        //     BodyValidationMiddleware.extractMatchedBodyData,
        //     DailyPostsMiddleware.validateDailyPostBelongsToUser,
        //     DailyPostsController.patch,
        // ]);

        return this.app;
    }
}
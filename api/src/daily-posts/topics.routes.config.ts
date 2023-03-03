import express from 'express';
import { body } from 'express-validator';
import { CommonRoutesConfig } from '../common/common.routes.config';
import TopicsController from './controllers/topics.controller';
import TopicsMiddleware from './middleware/topics.middleware';
import jwtMiddleware from '../auth/middlewares/jwt.middleware';
import BodyValidationMiddleware from '../common/middlewares/body.validation.middleware';
import { TopicStatus } from './enums/daily-posts.topic-status.enum';
import PermissionMiddleware from '../common/middlewares/common.permission.middleware';
import { PermissionFlag } from '../common/enums/common.permissionflag.enum';

export class TopicsRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'TopicsRoutes');
    }

    configureRoutes(): express.Application {
        this.app
            .route(`/topics`)
            .get(
                jwtMiddleware.validJWTNeeded,
                TopicsController.listTopics
            )
            .post(
                jwtMiddleware.validJWTNeeded,
                PermissionMiddleware.permissionFlagRequired(
                    PermissionFlag.ADMIN_PERMISSION
                ),
                body('text').isString(),
                body('startDate').isNumeric().optional(),
                body('endDate').isNumeric().optional(),
                body('status').isIn(Object.values(TopicStatus)).optional(),
                BodyValidationMiddleware.verifyBodyFieldsErrors,
                BodyValidationMiddleware.extractMatchedBodyData,
                TopicsController.createTopic
            );

        this.app.param(`topicId`, TopicsMiddleware.extractTopicId);
        this.app
            .route(`/topics/:topicId`)
            .all(
                jwtMiddleware.validJWTNeeded,
                TopicsMiddleware.validateTopicExists,
            )
            .get(TopicsController.getTopicById)
            .delete(
                PermissionMiddleware.permissionFlagRequired(
                    PermissionFlag.ADMIN_PERMISSION
                ),
                TopicsController.removeTopic
            );

        this.app.patch(`/topics/:topicId`, [
            jwtMiddleware.validJWTNeeded,
            PermissionMiddleware.permissionFlagRequired(
                PermissionFlag.ADMIN_PERMISSION
            ),
            body('topicId').isString().optional(),
            body('text').isString().optional(),
            body('startDate').isNumeric().optional(),
            body('endDate').isNumeric().optional(),
            body('status').isIn(Object.values(TopicStatus)).optional(),
            BodyValidationMiddleware.verifyBodyFieldsErrors,
            BodyValidationMiddleware.extractMatchedBodyData,
            TopicsController.patch,
        ]);

        return this.app;
    }
}
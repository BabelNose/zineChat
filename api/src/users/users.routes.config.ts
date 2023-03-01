import express from 'express';
import { body } from 'express-validator';
import { CommonRoutesConfig } from '../common/common.routes.config';
import UsersController from './controllers/users.controller';
import UsersMiddleware from './middleware/users.middleware';
import jwtMiddleware from '../auth/middlewares/jwt.middleware';
import BodyValidationMiddleware from '../common/middlewares/body.validation.middleware';
import PermissionMiddleware from '../common/middlewares/common.permission.middleware';
import { PermissionFlag } from '../common/enums/common.permissionflag.enum';

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }

    configureRoutes(): express.Application {
        this.app
            .route(`/users`)
            .get(
                jwtMiddleware.validJWTNeeded,
                PermissionMiddleware.permissionFlagRequired(
                    PermissionFlag.ADMIN_PERMISSION
                ),
                UsersController.listUsers
            )
            .post(
                body('email').isEmail(),
                body('password').isLength({ min: 5 }).withMessage('Must include password (5+ characters)'),
                BodyValidationMiddleware.verifyBodyFieldsErrors,
                UsersMiddleware.validateSameEmailDoesntExist,
                UsersController.createUser
            );

        this.app.param(`userId`, UsersMiddleware.extractUserId);
        this.app
            .route(`/users/:userId`)
            .all(
                    jwtMiddleware.validJWTNeeded,
                    UsersMiddleware.validateUserExists,
                    PermissionMiddleware.onlySameUserOrAdminCanDoThisAction
                )
            .get(UsersController.getUserById)
            .delete(UsersController.removeUser);
                
        this.app.put(`/users/:userId/permissionFlags/:permissionFlags`, [
            jwtMiddleware.validJWTNeeded,
            PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
            PermissionMiddleware.permissionFlagRequired(
                PermissionFlag.ADMIN_PERMISSION
            ),
            UsersMiddleware.validateUserExists,
            UsersController.updatePermissionFlags,
        ]);

        this.app.patch(`/users/:userId`, [
            jwtMiddleware.validJWTNeeded,
            body('password')
                .isLength({ min: 5 })
                .withMessage('Password must be 5+ characters')
                .optional(),
            body('username').isString().optional(),
            BodyValidationMiddleware.verifyBodyFieldsErrors,
            BodyValidationMiddleware.extractMatchedBodyData,
            UsersMiddleware.validatePatchEmail,
            PermissionMiddleware.userCantChangePermission,
            PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
            UsersController.patch,
        ]); 

        return this.app;
    }
}
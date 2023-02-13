import express from 'express';
import debug from 'debug';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Jwt } from '../../common/types/jwt';
import usersService from '../../users/services/users.service';
import config from '../../common/config/config';

const jwtSecret: string = config.JWT_SECRET;
const log: debug.IDebugger = debug('app:auth-middleware');

class JwtMiddleware {
    verifyRefreshCookie(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.cookies && req.cookies.refreshToken) {
            return next();
        } else {
            return res
                .status(400)
                .send({ errors: ['Missing required field: refreshToken'] });
        }
    }

    async validRefreshNeeded(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const user: any = await usersService.getUserByEmailWithPassword(
            res.locals.jwt.email
        );
        const salt = crypto.createSecretKey(
            Buffer.from(res.locals.jwt.refreshKey.data)
        );
        const hash = crypto
            .createHmac('sha512', salt)
            .update(res.locals.jwt.userId + jwtSecret)
            .digest('base64');
        if (hash === req.cookies.refreshToken) {
            req.body = {
                userId: user._id,
                email: user.email,
                permissionFlags: user.permissionFlags,
            };
            return next();
        } else {
            return res.status(400).send({ errors: ['Invalid refresh token'] });
        }
    }

    validJWTNeeded(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        try {
            log(req.cookies);
            if (req.cookies.accessToken) {
                res.locals.jwt = jwt.verify(
                    req.cookies.accessToken,
                    jwtSecret
                ) as Jwt;
                next();
            } else {
                return res.status(401).send();
            }
        } catch (err) {
            return res.status(403).send();
        }
    }
}

export default new JwtMiddleware();
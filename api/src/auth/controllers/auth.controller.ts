import express, { CookieOptions } from 'express';
import debug from 'debug';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../common/config/config';

const log: debug.IDebugger = debug('app:auth-controller');
const jwtSecret: string = config.JWT_SECRET;
const tokenExpirationInMS = 3600000;

class AuthController {
    async createJWT(req: express.Request, res: express.Response) {
        try {
            const refreshId = req.body.userId + jwtSecret;
            const salt = crypto.createSecretKey(crypto.randomBytes(16));
            const hash = crypto
                .createHmac('sha512', salt)
                .update(refreshId)
                .digest('base64');
            req.body.refreshKey = salt.export();
            const token = jwt.sign(req.body, jwtSecret, {
                expiresIn: tokenExpirationInMS,
            });
            const tokenCookieOptions: CookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', //TODO Maybe switch this back to none if I've got my SSL certificates setup
                maxAge: tokenExpirationInMS,
                path: '/'
            }
            res.cookie('refreshToken', hash, tokenCookieOptions);
            res.cookie('accessToken', token, tokenCookieOptions)
            return res
                .status(201)
                .send({userId: req.body.userId});
        } catch (err) {
            log('createJWT error: %O', err);
            return res.status(500).send();
        }
    }
}

export default new AuthController()
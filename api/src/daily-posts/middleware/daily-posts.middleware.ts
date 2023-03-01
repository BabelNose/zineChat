import express from 'express';
import dailyPostsService from '../services/daily-posts.service';
import debug from 'debug';

const log: debug.IDebugger = debug('app:daily-posts-middleware');
class DailyPostsMiddleware {
    async validateRequiredPostBodyFields(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.body && req.body.text) {
            next();
        } else {
            res.status(400).send({
                errors: [`Missing required fields text`],
            });
        }
    }
    
    async validateDailyPostBelongsToUser(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const post = await dailyPostsService.readById(req.body.postId);
        if (res.locals.jwt.payload.userId === post?.userId?.toString()){
            next();
        } else {
            res.status(400).send({ errors: [`Invalid post`] });
        }
    }
    
    async validatePostExists(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const post = await dailyPostsService.readById(req.body.postId);
        if (post) {
            res.locals.post = post;
            next();
        } else {
            res.status(404).send({
                errors: [`Post ${req.body.postId} not found`],
            });
        }
    }

    async extractPostId(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
            req.body.postId = req.params.postId;
            next();
        }else{
            res.status(404).send({
                errors: [`Post ${req.params.postId} not found`],
            });
        }
    }
}

export default new DailyPostsMiddleware();
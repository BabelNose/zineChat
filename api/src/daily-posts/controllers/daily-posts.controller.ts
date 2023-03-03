import express from 'express';
import DailyPostsService from '../services/daily-posts.service';
import debug from 'debug';

const log: debug.IDebugger = debug('app:daily-posts-controller');
class DailyPostsController {
    async listDailyPosts(req: express.Request, res: express.Response) {
        const posts = await DailyPostsService.list(100, 0);
        res.status(200).send(posts);
    }

    async getDailyPostById(req: express.Request, res: express.Response) {
        const post = await DailyPostsService.readById(req.body.postId);
        res.status(200).send(post);
    }

    async createDailyPost(req: express.Request, res: express.Response) {
        const postId = await DailyPostsService.create({...req.body, userId:res.locals.jwt.payload.userId});
        res.status(201).send({ id: postId });
    }

    async patch(req: express.Request, res: express.Response) {
        log(await DailyPostsService.patchById(req.body.postId, req.body));
        res.status(204).send();
    }

    async put(req: express.Request, res: express.Response) {
        log(await DailyPostsService.putById(req.body.postId, req.body));
        res.status(204).send();
    }

    async removeDailyPost(req: express.Request, res: express.Response) {
        log(await DailyPostsService.deleteById(req.body.postId));
        res.status(204).send();
    }
}

export default new DailyPostsController();
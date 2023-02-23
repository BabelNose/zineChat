import express from 'express';
import TopicsService from '../services/topics.service';
import debug from 'debug';

const log: debug.IDebugger = debug('app:topics-controller');
class TopicsController {
    async listTopics(req: express.Request, res: express.Response) {
        const topics = await TopicsService.list(100, 0);
        res.status(200).send(topics);
    }

    async getTopicById(req: express.Request, res: express.Response) {
        const topic = await TopicsService.readById(req.body.topicId);
        res.status(200).send(topic);
    }

    async createTopic(req: express.Request, res: express.Response) {
        const topicId = await TopicsService.create(req.body);
        res.status(201).send({ id: topicId });
    }

    async patch(req: express.Request, res: express.Response) {
        log(await TopicsService.patchById(req.body.topicId, req.body));
        res.status(204).send();
    }

    async put(req: express.Request, res: express.Response) {
        log(await TopicsService.putById(req.body.topicId, req.body));
        res.status(204).send();
    }

    async removeTopic(req: express.Request, res: express.Response) {
        log(await TopicsService.deleteById(req.body.topicId));
        res.status(204).send();
    }
}

export default new TopicsController();
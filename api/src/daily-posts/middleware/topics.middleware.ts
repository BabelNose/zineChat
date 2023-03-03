import express from 'express';
import topicsService from '../services/topics.service';
import debug from 'debug';

const log: debug.IDebugger = debug('app:topics-middleware');
class TopicsMiddleware {
    async validateRequiredPostBodyFields(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.body && req.body.text && req.body.startDate) {
            next();
        } else {
            res.status(400).send({
                errors: [`Missing required fields text`],
            });
        }
    }
    
    async validateTopicExists(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const topic = await topicsService.readById(req.body.topicId);
        if (topic) {
            res.locals.topic = topic;
            next();
        } else {
            res.status(404).send({
                errors: [`Topic ${req.body.topicId} not found`],
            });
        }
    }

    async extractTopicId(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.params.topicId.match(/^[0-9a-fA-F]{24}$/)) {
            req.body.topicId = req.params.topicId;
            next();
        }else{
            res.status(404).send({
                errors: [`Topic ${req.params.topicId} not found`],
            });
        }
    }
}

export default new TopicsMiddleware();
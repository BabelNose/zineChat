import express from 'express';
import { validationResult, matchedData } from 'express-validator';

class BodyValidationMiddleware {
    verifyBodyFieldsErrors(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }
        next();
    }

    extractMatchedBodyData(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const matches = matchedData(req);
        console.log("MIDDLE WARE", matches);
        req.body = matches;
        next();
    }
}

export default new BodyValidationMiddleware();
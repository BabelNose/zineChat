import express from 'express';
import debug from 'debug';

const log: debug.IDebugger = debug('app:common-csrf-error-handler-middleware');

interface CSRFError {
    code:string
}

class CsrfErrorHandler {
    handleCsrfError(
        error: CSRFError,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        console.log(error);
        if (error.code === 'EBADCSRFTOKEN') {
            log("CSRF Token Get");
            return res.status(403).send();
          } 
          return next(error);
    }
}

export default new CsrfErrorHandler();
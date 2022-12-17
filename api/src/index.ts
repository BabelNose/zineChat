import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import {orm} from './connections';

const app = express()
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
    res.send('<h1>Hello world</h1>');
});

app.post('/register', (req: Request, res: Response) => {

});

app.post('/login'), (req: Request, res: Response) => {

};
  
app.listen(3000, () => {
  console.log('listening on *:3000');
});
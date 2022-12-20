import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import { usersRepo } from './repositories/usersRepo';
import OAuth2Server from 'oauth2-server';

const app = express()

app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
    res.send('<h1>Hello world</h1>');
});

app.post('/register', (req: Request, res: Response) => {
  console.log("register request", req.body);
  const newUser = new usersRepo({...req.body});
  newUser.save((err) => {
    if (err) throw new Error(`There was an error creating a new user: ${err}`);
  });
  
  res.send("Thanks bro");
});

app.post('/login'), (req: Request, res: Response) => {

};
  
app.listen(3000, () => {
  console.log('listening on *:3000');
});
import app from "..";
import express, { Request, Response } from "express";

const router = express.Router();
router.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express and TypeScript!');
});

router.get('/user', (req: Request, res: Response) => {
    res.send('User route');
} 
);  

export default router;


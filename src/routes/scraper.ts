import express, { Request, Response, Router } from 'express';

const router:Router = express.Router();

router.get('/documents', (req: Request, res: Response) => {
  res.send('Hello World!');
});

export default router;

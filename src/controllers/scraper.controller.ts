import { type Request, type Response, type NextFunction } from 'express';
import { run } from '../services/scraper.service.js';

export async function getDocuments(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await run();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

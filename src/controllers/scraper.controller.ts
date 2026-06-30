import { type Request, type Response, type NextFunction } from 'express';
import { run } from '../services/scraper.service.js';

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const busqueda = (req.query.q as string) || '';
    const maxPages = parseInt(req.query.pages as string) || 5;
    const result = await run(busqueda, maxPages);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

import { Router } from 'express';
import { getDocuments } from '../controllers/scraper.controller.js';

const router = Router();

router.get('/documents', getDocuments);

export default router;

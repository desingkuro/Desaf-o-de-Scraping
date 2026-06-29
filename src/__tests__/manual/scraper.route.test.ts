import express, { type Request, type Response, Router } from 'express';
import * as cheerio from 'cheerio';
import { getPage } from '../../services/http.service.js';
import { extractViewState, extractJsessionId, parseXmlToPageResult } from '../../services/parser.service.js';

const router: Router = Router();

router.get('/documents-test', async (req: Request, res: Response, next: express.NextFunction) => {
  console.log('Testing route (legacy)');
  const countPages = 3;
  try {
    const data = await getPage();
    const cookies = data.headers['set-cookie'];
    const viewState = extractViewState(data.data);
    const jsessionid = extractJsessionId(data);
    if (!viewState) {
      throw new Error('No se pudo encontrar el token javax.faces.ViewState');
    }
    let currentViewState = viewState;
    for (let index = 0; index < countPages; index++) {
      console.log(`Test iteration ${index}`);
    }
    res.send({ cookies, viewState });
  } catch (error) {
    next(error);
  }
});

export default router;

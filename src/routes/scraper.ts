import express, { Request, Response, Router } from 'express';
import { getData, parseXml, postBtn } from '../utils/utils.js';
import * as cheerio from 'cheerio';

const router:Router = express.Router();

router.get('/documents', async (req: Request, res: Response, next: express.NextFunction) => {
  console.log('Testing route');
  const data = await getData(next);
  try {
    const cookies = data.headers['set-cookie'];
    const $1 = cheerio.load(data.data);
    const viewState = $1('input[name="javax.faces.ViewState"]').val();
    const jsessionid = cookies[0].split(';')[0].split('=')[1];
    if (!viewState) {
      throw new Error('No se pudo encontrar el token javax.faces.ViewState');
    }
    const postBtnResponse = await postBtn({viewState, jsessionid, next});
    const parsedXml = parseXml({xml: postBtnResponse, jsessionid});
    res.send({ cookies, viewState, data: data.data, parsedXml });
  } catch (error) {
    next(error);
  }
});

export default router;


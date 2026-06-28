import express, { Request, Response, Router } from 'express';
import { getData, parseXml, postBtn } from '../utils/utils.js';
import * as cheerio from 'cheerio';

const router:Router = express.Router();

router.get('/documents', async (req: Request, res: Response, next: express.NextFunction) => {
  console.log('Testing route');
  const countPages = 176;
  const data = await getData(next);
  let viewState:string;
  try {
    const cookies = data.headers['set-cookie'];
    const $1 = cheerio.load(data.data);
    viewState = $1('input[name="javax.faces.ViewState"]').val() as string;
    const jsessionid = cookies[0].split(';')[0].split('=')[1];
    if (!viewState) {
      throw new Error('No se pudo encontrar el token javax.faces.ViewState');
    }
    for (let index = 0; index < countPages; index++) {
      const postBtnResponse = await postBtn({viewState, jsessionid, next, pageIndex: (index+1)*10});
      viewState = (await parseXml({xml: postBtnResponse, jsessionid, next, index})).nuevoViewState;
    }
    res.send({ cookies, viewState, data: data.data });
  } catch (error) {
    next(error);
  }
});

export default router;


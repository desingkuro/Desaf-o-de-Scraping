import express, { Request, Response, Router } from 'express';
import { getData } from '../utils/utils.js';
import * as cheerio from 'cheerio';

const router:Router = express.Router();

router.get('/documents', async (req: Request, res: Response, next: express.NextFunction) => {
  const data = await getData(next);
  try {
    const cookies = data.headers['set-cookie'];
    const $1 = cheerio.load(data);
    const viewState = $1('input[name="javax.faces.ViewState"]').val();
    if (!viewState) {
      throw new Error('No se pudo encontrar el token javax.faces.ViewState');
    }
    const bton = $1('#listarDetalleInfraccionRAAForm:btnBuscar').attr('onclick');
    res.send({ cookies, viewState, bton });
  } catch (error) {
    next(error);
  }
});

export default router;


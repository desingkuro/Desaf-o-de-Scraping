import express, { Request, Response, Router } from 'express';
import { getData } from '../utils/utils';
import  Cheerio  from 'cheerio';

const router:Router = express.Router();

router.get('/documents', async (req: Request, res: Response, next: express.NextFunction) => {
  const data = await getData(next);
  try {
    const $ = Cheerio.load(data.data);
    const bton = $('#listarDetalleInfraccionRAAForm:btnBuscar').attr('onclick');
    res.send(data);
  } catch (error) {
    next(error);
  }
});

export default router;


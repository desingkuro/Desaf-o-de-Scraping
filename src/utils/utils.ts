import axios from "axios";
import * as cheerio from "cheerio";
import 'dotenv/config';
import { NextFunction } from "express";
import { TypeArgumentPostBtn, TypeDataWithRetry, TypeParserXmlArg } from "./types/getData.js";

const url: string = process.env.BASE_URL_DEV!;

export const postData = async (data: any, headers: any, next: NextFunction): Promise<any> => {
  try {
    return await axios.post(url, data, { headers });
  } catch (error: any) {
    console.error('Error in postData function');
    next(error);
    return null;
  }
};

export const getData = async (next: NextFunction): Promise<any> => {
  try {
    console.log('Getting data from:', url);
    return await axios.get(url);
  } catch (error: any) {
    console.error('Error in getData function');
    next(error);
    return null;
  }
};

export const DataWithRetry = async ({ url, next, retry = 3, delay = 1000, responseType = 'json', headers, data }: TypeDataWithRetry): Promise<any> => {
  try {
    const response = await axios.post(url, data, { headers, responseType });
    return response.data;
  } catch (error: any) {
    console.error('Error in getDataWithRetry function');
    const retryAfter = error.response?.headers['retry-after'];
    const delayToUse = retryAfter ? parseInt(retryAfter) * 1000 : delay;
    if (retry > 0 && error.response?.status === 429) {
      await new Promise(resolve => setTimeout(resolve, delayToUse));
      return DataWithRetry({ url, next, retry: retry - 1, delay: delayToUse * 2, responseType, headers });
    }
    if (next) {
      next(error);
    }
    return null;
  }
}

export const postBtn = async ({ viewState, jsessionid, next }: TypeArgumentPostBtn): Promise<any> => {
  const params = new URLSearchParams({
    'javax.faces.partial.ajax': 'true',
    'javax.faces.source': 'listarDetalleInfraccionRAAForm:btnBuscar',
    'javax.faces.partial.execute': '@all',
    'javax.faces.partial.render': 'listarDetalleInfraccionRAAForm:pgLista listarDetalleInfraccionRAAForm:txtNroexp',
    'listarDetalleInfraccionRAAForm:btnBuscar': 'listarDetalleInfraccionRAAForm:btnBuscar',
    'listarDetalleInfraccionRAAForm': 'listarDetalleInfraccionRAAForm',
    'listarDetalleInfraccionRAAForm:txtNroexp': '',
    'listarDetalleInfraccionRAAForm:j_idt21': '',
    'listarDetalleInfraccionRAAForm:j_idt25': '',
    'listarDetalleInfraccionRAAForm:idsector': '',
    'listarDetalleInfraccionRAAForm:j_idt34': '',
    'listarDetalleInfraccionRAAForm:dt_scrollState': '0,0',
    'javax.faces.ViewState': Array.isArray(viewState) ? viewState[0] : viewState
  });
  const response = await postData(params.toString(), {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `JSESSIONID=${jsessionid}`,
    'Faces-Request': 'partial/ajax',
    'X-Requested-With': 'XMLHttpRequest'
  }, next);
  return response.data;
}

export const parseXml = async ({ xml, jsessionid }: TypeParserXmlArg) => {
  const $xml = cheerio.load(xml, { xmlMode: true });
  const tablaHtml = $xml('update[id="listarDetalleInfraccionRAAForm:pgLista"]').text();
  const $ = cheerio.load(tablaHtml);

  const viewStateRaw = $xml('update[id="j_id1:javax.faces.ViewState:0"]').text();
  const nuevoViewState = cheerio.load(viewStateRaw).text();

  const filas: Array<{ paramUuid: string; btnId: string; nro: string }> = [];
  $('tr[data-ri]').each((index, row) => {
    const celdas = $(row).find('td');
    const onclick = $(celdas[6]).find('a').attr('onclick') || '';
    const match = onclick.match(/param_uuid['"]\s*:\s*['"]([^'"]+)/);
    const paramUuid = match ? match[1] : null;
    if (paramUuid) {
      filas.push({
        paramUuid,
        btnId: `listarDetalleInfraccionRAAForm:dt:${index}:j_idt63`,
        nro: $(celdas[0]).text().trim()
      });
    }
  });

  for (const fila of filas) {
    await downloadPdf(jsessionid, nuevoViewState, fila.paramUuid, fila.btnId, `./pdfs/${fila.nro}.pdf`);
  }

  return {
    nuevoViewState
  };
}

async function downloadPdf(
  jsessionid: string,
  viewState: string,
  paramUuid: string,
  botonId: string,
  outputPath: string
) {
  const params = new URLSearchParams({
    'listarDetalleInfraccionRAAForm': 'listarDetalleInfraccionRAAForm',
    'listarDetalleInfraccionRAAForm:txtNroexp': '',
    'listarDetalleInfraccionRAAForm:j_idt21': '',
    'listarDetalleInfraccionRAAForm:j_idt25': '',
    'listarDetalleInfraccionRAAForm:idsector': '',
    'listarDetalleInfraccionRAAForm:j_idt34': '',
    'listarDetalleInfraccionRAAForm:dt_scrollState': '0,0',
    [botonId]: botonId,
    'param_uuid': paramUuid,
    'javax.faces.ViewState': viewState,
    'javax.faces.source': botonId,
  });

  const responseRetry = await DataWithRetry({
    url,
    data: params.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `JSESSIONID=${jsessionid}`,
    },
    responseType: 'arraybuffer',
    retry: 3,
    delay: 1000,
  });

  const fs = await import('fs');
  fs.writeFileSync(outputPath, Buffer.from(responseRetry.data));
  console.log(`PDF descargado: ${outputPath}`);
}
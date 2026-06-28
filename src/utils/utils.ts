import axios from "axios";
import * as cheerio from "cheerio";
import 'dotenv/config';
import fs from 'fs';
import { NextFunction } from "express";
import { GetParamsType, TypeArgumentPostBtn, TypeDataWithRetry, TypeDownloadPdfArg, TypeParserXmlArg, TypePostBtn } from "./types/getData.js";

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
      console.log('Retry after:', delayToUse);
      await new Promise(resolve => setTimeout(resolve, delayToUse));
      return DataWithRetry({
        url,
        data,
        next,
        retry: retry - 1,
        delay: delayToUse * 2,
        responseType,
        headers,
      });
    }
    if (next) {
      next(error);
    }
    return null;
  }
}

export const postBtn = async ({ viewState, jsessionid, next, pageIndex }: TypeArgumentPostBtn): Promise<any> => {
  const typeOption: TypePostBtn = pageIndex === 10 ? 'postBtn' : 'pagination'
  const params = getParams({type:typeOption, pageIndex, viewState});
  const response = await postData(params.toString(), {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `JSESSIONID=${jsessionid}`,
    'Faces-Request': 'partial/ajax',
    'X-Requested-With': 'XMLHttpRequest'
  }, next);
  return response.data;
}

export const parseXml = async ({ xml, jsessionid, next, index }: TypeParserXmlArg) => {
  const id:string = index === 0 ? 'listarDetalleInfraccionRAAForm:pgLista' : 'listarDetalleInfraccionRAAForm:dt';
  const $xml = cheerio.load(xml, { xmlMode: true });
  const tablaHtml = $xml(`update[id="${id}"]`).text();
  const $ = cheerio.load(index === 0 ? tablaHtml : `<table>${tablaHtml}</table>`);

  const viewStateRaw = $xml('update[id="j_id1:javax.faces.ViewState:0"]').text();
  const nuevoViewState = cheerio.load(viewStateRaw).text();

  const filas: Array<{ paramUuid: string; btnId: string; nro: string }> = [];
  console.log('Trs encontrados:', $('tr[data-ri]').length);
  $('tr[data-ri]').each((_index, row) => {
    const celdas = $(row).find('td');
    const onclick = $(celdas[6]).find('a').attr('onclick') || '';
    const match = onclick.match(/param_uuid['"]\s*:\s*['"]([^'"]+)/);
    const paramUuid = match ? match[1] : null;
    console.log('Param UUID:', paramUuid);
    if (paramUuid) {
      filas.push({
        paramUuid,
        btnId: `listarDetalleInfraccionRAAForm:dt:${_index}:j_idt63`,
        nro: $(celdas[1]).text().trim().split('/').join('-')
      });
    }
  });
  console.log('Filas encontradas:', filas.length);
  /*for (const fila of filas) {
    await downloadPdf({
      jsessionid,
      viewState: nuevoViewState,
      paramUuid: fila.paramUuid,
      botonId: fila.btnId,
      outputPath: `./pdfs/${fila.nro}.pdf`,
      next
    });
  }*/

  return {
    nuevoViewState
  };
}

async function downloadPdf({
  jsessionid,
  viewState,
  paramUuid,
  botonId,
  outputPath,
  next
}: TypeDownloadPdfArg) {

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

  try {
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
    writeFileSync(outputPath, Buffer.from(responseRetry));
    console.log(`PDF descargado: ${outputPath}`);
  } catch (error) {
    console.error(`Error descargando PDF para ${outputPath}:`, error);
  }
}

const writeFileSync = (path: string, data: Buffer) => {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, data);
  } else {
    fs.mkdirSync(path, { recursive: true });
    fs.writeFileSync(path, data);
  }
}

const getParams = ({ type, pageIndex, viewState }: GetParamsType) => {

  const params = {
    "postBtn": {
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
    },
    "pagination": {
      "javax.faces.partial.ajax": "true",
      "javax.faces.source": "listarDetalleInfraccionRAAForm:dt",
      "javax.faces.partial.execute": "listarDetalleInfraccionRAAForm:dt",
      "javax.faces.partial.render": "listarDetalleInfraccionRAAForm:dt",
      "listarDetalleInfraccionRAAForm:dt": "listarDetalleInfraccionRAAForm:dt",
      "listarDetalleInfraccionRAAForm:dt_pagination": "true",
      "listarDetalleInfraccionRAAForm:dt_first": `${(pageIndex - 10).toString()}`,
      "listarDetalleInfraccionRAAForm:dt_rows": "10",
      "listarDetalleInfraccionRAAForm:dt_skipChildren": "true",
      "listarDetalleInfraccionRAAForm:dt_encodeFeature": "true",
      "listarDetalleInfraccionRAAForm": "listarDetalleInfraccionRAAForm",
      "listarDetalleInfraccionRAAForm:txtNroexp": "",
      "listarDetalleInfraccionRAAForm:j_idt21": "",
      "listarDetalleInfraccionRAAForm:j_idt25": "",
      "listarDetalleInfraccionRAAForm:idsector": "",
      "listarDetalleInfraccionRAAForm:j_idt34": "",
      "listarDetalleInfraccionRAAForm:dt_scrollState": "0,0",
      "javax.faces.ViewState": (Array.isArray(viewState) ? viewState[0] : viewState)?.toString() ?? ""
    }
  };
  return new URLSearchParams(params[type] as Record<string, string>);
}
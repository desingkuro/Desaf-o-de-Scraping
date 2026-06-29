import * as cheerio from 'cheerio';
import axios, { type AxiosResponse } from 'axios';
import { config } from '../config/index.js';


const url = config.baseUrl;

export async function getPage(): Promise<AxiosResponse> {
  console.log('Getting data from:', url);
  return axios.get(url);
}

export async function postAjax(params: string, jsessionid: string): Promise<string> {
  const response = await axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `JSESSIONID=${jsessionid}`,
      'Faces-Request': 'partial/ajax',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  return response.data;
}

export async function postButton(
  buttonParams: Record<string, string>,
  jsessionid: string,
  viewState: string,
): Promise<string> {
  const params = new URLSearchParams({
    ...buttonParams,
    'formBuscador': 'formBuscador',
    'javax.faces.ViewState': viewState,
    'javax.faces.source': buttonParams['formBuscador:j_idt31'] || '',
    'javax.faces.partial.ajax': 'true',
    'javax.faces.partial.execute': '@all',
    'javax.faces.partial.render': 'formBuscador:panel',
  });

  return postAjax(params.toString(), jsessionid);
}

export async function postWithRetry(
  data: string,
  headers: Record<string, string>,
  responseType: 'arraybuffer' | 'json' | 'text' = 'json',
  retry = 3,
  delay = 1000,
): Promise<any> {
  try {
    const response = await axios.post(url, data, { headers, responseType });
    return response.data;
  } catch (error: any) {
    const retryAfter = error.response?.headers['retry-after'];
    const delayToUse = retryAfter ? parseInt(retryAfter) * 1000 : delay;
    if (retry > 0 && error.response?.status === 429) {
      console.log('Retry after:', delayToUse);
      await new Promise(resolve => setTimeout(resolve, delayToUse));
      return postWithRetry(data, headers, responseType, retry - 1, delayToUse * 2);
    }
    throw error;
  }
}

export async function postForm(
  params: string,
  jsessionid: string | undefined,
  formAction: string,
): Promise<string> {
  const fullUrl = new URL(formAction, config.baseUrl).href;
  const response = await axios.post(fullUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(jsessionid ? { 'Cookie': `JSESSIONID=${jsessionid}` } : {}),
    },
  });
  return response.data;
}

export function getParams(type: 'postBtn' | 'pagination', pageIndex: number, viewState: string): URLSearchParams {
  const templates: Record<string, Record<string, string>> = {
    postBtn: {
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
      'javax.faces.ViewState': viewState,
    },
    pagination: {
      'javax.faces.partial.ajax': 'true',
      'javax.faces.source': 'listarDetalleInfraccionRAAForm:dt',
      'javax.faces.partial.execute': 'listarDetalleInfraccionRAAForm:dt',
      'javax.faces.partial.render': 'listarDetalleInfraccionRAAForm:dt',
      'listarDetalleInfraccionRAAForm:dt': 'listarDetalleInfraccionRAAForm:dt',
      'listarDetalleInfraccionRAAForm:dt_pagination': 'true',
      'listarDetalleInfraccionRAAForm:dt_first': `${pageIndex - 10}`,
      'listarDetalleInfraccionRAAForm:dt_rows': '10',
      'listarDetalleInfraccionRAAForm:dt_skipChildren': 'true',
      'listarDetalleInfraccionRAAForm:dt_encodeFeature': 'true',
      'listarDetalleInfraccionRAAForm': 'listarDetalleInfraccionRAAForm',
      'listarDetalleInfraccionRAAForm:txtNroexp': '',
      'listarDetalleInfraccionRAAForm:j_idt21': '',
      'listarDetalleInfraccionRAAForm:j_idt25': '',
      'listarDetalleInfraccionRAAForm:idsector': '',
      'listarDetalleInfraccionRAAForm:j_idt34': '',
      'listarDetalleInfraccionRAAForm:dt_scrollState': '0,0',
      'javax.faces.ViewState': viewState,
    },
  };

  return new URLSearchParams(templates[type]);
}

export function getTotalPages(xml: string) {
  const $xml = cheerio.load(xml, { xmlMode: true });
  const totalText = $xml(`span[id="formBuscador:optResultado"]`).text();
  const totalRecords = parseInt(totalText.match(/\d+/g)?.[8] || '0', 10);
  const totalPages = Math.ceil(totalRecords / 10);
  return totalPages;
}

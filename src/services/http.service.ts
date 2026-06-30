import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios';
import { config } from '../config/index.js';


const url = config.baseUrl;
const resultUrl = config.resultUrl;

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err.response?.status === 429;
      const retryAfter = err.response?.headers?.['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt;

      if (is429 && attempt < retries) {
        console.log(`  429 (${attempt}/${retries}), esperando ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('unreachable');
}

export async function getPage(): Promise<AxiosResponse> {
  console.log('Getting data from:', url);
  return axios.get(url);
}

export async function downloadPdf(
  pdfUrl: string,
  filepath: string,
  jsessionid: string,
): Promise<void> {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const response = await withRetry(() => axios.get(pdfUrl, {
    responseType: 'arraybuffer',
    headers: { 'Cookie': `JSESSIONID=${jsessionid}` },
  }));
  fs.writeFileSync(filepath, response.data);
}

export async function postPaginationAjax(
  params: string,
  jsessionid: string,
): Promise<string> {
  const response = await withRetry(() => axios.post(resultUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Cookie': `JSESSIONID=${jsessionid}`,
      'Faces-Request': 'partial/ajax',
      'X-Requested-With': 'XMLHttpRequest',
    },
  }));
  return response.data;
}

export async function postDetailAjax(
  params: string,
  jsessionid: string,
): Promise<string> {
  const response = await withRetry(() => axios.post(resultUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Cookie': `JSESSIONID=${jsessionid}`,
      'Faces-Request': 'partial/ajax',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://jurisprudencia.pj.gob.pe',
      'Referer': 'https://jurisprudencia.pj.gob.pe/jurisprudenciaweb/faces/page/resultado.xhtml',
    },
  }));
  return response.data;
}

export async function postForm(
  params: string,
  jsessionid: string | undefined,
  formAction: string,
): Promise<string> {
  const cleanAction = formAction.split(';')[0];
  const sessionSuffix = jsessionid ? `;jsessionid=${jsessionid}` : '';
  const fullUrl = `https://jurisprudencia.pj.gob.pe${cleanAction}${sessionSuffix}`;
  const cookieHeader = jsessionid ? { 'Cookie': `JSESSIONID=${jsessionid}` } : {};

  try {
    const response = await withRetry(() => axios.post(fullUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...cookieHeader,
      },
      maxRedirects: 0,
    }));
    return response.data;
  } catch (err: any) {
    const location = err.response?.headers?.['location'];
    if (location) {
      const httpsLocation = location.replace('http://', 'https://');
      const result = await withRetry(() => axios.get(httpsLocation, {
        headers: cookieHeader,
      }));
      return result.data;
    }
    throw err;
  }
}

export function getTotalPages(xml: string) {
  const $xml = cheerio.load(xml);
  const totalText = $xml(`span[id="formBuscador:optResultado"]`).text();
  const numbers = totalText.match(/\d+/g);
  const totalRecords = parseInt(numbers?.[numbers.length - 1] || '0', 10);
  const totalPages = Math.ceil(totalRecords / 10);
  return totalPages;
}

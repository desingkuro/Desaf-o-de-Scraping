import * as cheerio from 'cheerio';
import type { Fila, PageResult } from '../types/scraper.types.js';
import { getTotalPages } from './http.service.js';

export function extractViewState(html: string): string | undefined {
  const $ = cheerio.load(html);
  return $('input[name="javax.faces.ViewState"]').val() as string | undefined;
}

export function extractJsessionId(response: any): string {
  const cookies: string[] = response.headers['set-cookie'];
  return cookies[0].split(';')[0].split('=')[1];
}

export function parseXmlToPageResult(xml: string): PageResult {
  const $xml = cheerio.load(xml, { xmlMode: true });
  const totalPages = getTotalPages(xml);
  const viewStateRaw = $xml('input[name="javax.faces.ViewState"]').val() as string
  const nuevoViewState = cheerio.load(viewStateRaw).text();
  let nResolution: string | undefined;

  const items: Fila[] = [];
  $xml('div[id="formBuscador:panel"] > div').each((_i, item) => {
    const container = $xml(`div[id="formBuscador:repeat:${_i}:j_idt455_header"]`);
    const allTds = container.find('td');
    nResolution = allTds.eq(2).find('span').text();
    const params = extractParamsFromA($xml, _i);

    items.push({
      nResolution,
      params
    });
  });

  return { nuevoViewState, totalPages, filas: items };
}

export function extractFormAction(html: string): string | undefined {
  const $ = cheerio.load(html);
  return $('#formBuscador').attr('action');
}

export function extractParamsFromA($xml: cheerio.CheerioAPI, index: number): Record<string, string> | null {
  const onclick = $xml(`a[id="formBuscador:repeat:${index}:j_idt491"]`).attr('onclick') || '';

  const match = onclick.match(/RichFaces\.ajax\([^,]+,[^,]+,\s*(\{.+?\})\s*\)/);
  if (!match) return null;

  try {
    const rawJson = match[1]
      .replace(/\\u002D/g, '-')
      .replace(/\\\//g, '/')
      .replace(/\\"/g, '"')
      .replace(/&quot;/g, '"');

    const parsed = JSON.parse(rawJson);
    return parsed.parameters || null;
  } catch {
    return null;
  }
}

export function extractButtonParams(onclick: string): Record<string, string> | null {
  const match = onclick.match(/mojarra\.jsfcljs\([^,]+,\s*\{(.+?)\},\s*''\)/);
  if (!match) return null;

  const params: Record<string, string> = {};
  const pairs = match[1].match(/'[^']+'\s*:\s*'[^']*'/g);
  if (pairs) {
    for (const pair of pairs) {
      const sep = pair.indexOf(':');
      const key = pair.slice(1, sep - 1).trim();
      const val = pair.slice(sep + 2, -1).trim();
      params[key] = val;
    }
  }
  return params;
}

export function getSearchButtonParams(html: string): Record<string, string> | null {
  const $ = cheerio.load(html);
  const onclick = $('input[name="formBuscador:j_idt31"]').attr('onclick');
  if (!onclick) return null;
  return extractButtonParams(onclick);
}
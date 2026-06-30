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
  const $xml = cheerio.load(xml);
  const totalPages = getTotalPages(xml);
  const viewStateRaw = $xml('input[name="javax.faces.ViewState"]').val() as string
  const nuevoViewState = cheerio.load(viewStateRaw).text();

  const items: Fila[] = [];
  $xml('div[id="formBuscador:panel"] > div').each((_i, item) => {
    const headerDiv = $xml(item).find(`div[id="formBuscador:repeat:${_i}:j_idt455_header"]`);
    const allTds = headerDiv.find('td');
    const recurso = allTds.eq(1).find('span').text().trim();
    const nResolution = allTds.eq(2).find('span').text().trim();

    const bodyDiv = $xml(item).find(`div[id="formBuscador:repeat:${_i}:j_idt455_body"]`);
    const detail: Record<string, string> = {};
    bodyDiv.find('.row').each((_, row) => {
      const label = $xml(row).find('.txtbold').text().replace(':', '').trim();
      const value = $xml(row).find('.col-md-12').not('.txtbold').text().trim();
      if (label && value) {
        detail[label] = value;
      }
    });

    const pdfUrl = extractPdfUrlFromRow($xml, _i);
    const params = extractParamsFromA($xml, _i);

    items.push({
      recurso,
      nResolution,
      pdfUrl,
      detail,
      params,
    });
  });

  return { nuevoViewState, totalPages, filas: items };
}

export function extractPdfUrlFromRow($xml: cheerio.CheerioAPI, index: number): string | null {
  const link = $xml(`div[id="formBuscador:repeat:${index}:j_idt455_body"] a[href*="ServletDescarga"]`).first();
  const href = link.attr('href');
  if (!href) return null;
  return `https://jurisprudencia.pj.gob.pe${href}`;
}

export function extractFormAction(html: string): string | undefined {
  const $ = cheerio.load(html);
  return $('#formBuscador').attr('action');
}

export function extractFormFields(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const fields: Record<string, string> = {};

  $('#formBuscador input').each((_, el) => {
    const name = $(el).attr('name');
    if (!name) return;
    const value = $(el).attr('value') || '';
    fields[name] = value;
  });

  $('#formBuscador select').each((_, el) => {
    const name = $(el).attr('name');
    if (!name) return;
    const value = $(el).val() as string || '';
    fields[name] = value;
  });

  return fields;
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

export function buildRowDetailParams(
  index: number,
  viewState: string,
  formFields: Record<string, string>,
  rowParams: Record<string, string>,
): URLSearchParams {
  const linkId = `formBuscador:repeat:${index}:j_idt491`;

  const params: Record<string, string> = {
    ...formFields,
    'formBuscador': 'formBuscador',
    'javax.faces.ViewState': viewState,
    'javax.faces.source': linkId,
    'javax.faces.partial.event': 'click',
    'javax.faces.partial.execute': `${linkId} @component`,
    'javax.faces.partial.render': '@component',
    ...rowParams,
    'org.richfaces.ajax.component': linkId,
    [linkId]: linkId,
    'AJAX:EVENTS_COUNT': '1',
    'javax.faces.partial.ajax': 'true',
  };

  return new URLSearchParams(params);
}

export function buildPaginationParams(
  page: number,
  viewState: string,
  formFields: Record<string, string>,
): URLSearchParams {
  const params: Record<string, string> = {
    ...formFields,
    'formBuscador': 'formBuscador',
    'javax.faces.ViewState': viewState,
    'javax.faces.source': 'formBuscador:data1',
    'javax.faces.partial.ajax': 'true',
    'javax.faces.partial.execute': '@all',
    'javax.faces.partial.render': 'formBuscador:panel formBuscador:data1',
    'formBuscador:data1:page': String(page),
    'org.richfaces.ajax.component': 'formBuscador:data1',
    'AJAX:EVENTS_COUNT': '1',
  };
  return new URLSearchParams(params);
}

export function extractViewStateFromXml(xml: string): string | null {
  const $ = cheerio.load(xml, { xmlMode: true });
  const update = $('update[id="javax.faces.ViewState"]');
  if (!update.length) return null;
  return update.text() || null;
}

export function extractPanelHtml(xml: string): string | null {
  const $ = cheerio.load(xml, { xmlMode: true });
  const update = $('update[id="formBuscador:panel"]');
  if (!update.length) return null;
  return update.text() || null;
}

export function parsePanelToFilas(html: string): Fila[] {
  const $ = cheerio.load(html);
  const items: Fila[] = [];
  $('div[id="formBuscador:panel"] > div, > div').each((_i, item) => {
    const id = $(item).attr('id') || '';
    const match = id.match(/formBuscador:repeat:(\d+):j_idt455/);
    const index = match ? parseInt(match[1]) : _i;

    const headerDiv = $(item).find(`div[id$="j_idt455_header"]`);
    const allTds = headerDiv.find('td');
    const recurso = allTds.eq(1).find('span').text().trim();
    const nResolution = allTds.eq(2).find('span').text().trim();

    const bodyDiv = $(item).find(`div[id$="j_idt455_body"]`);
    const detail: Record<string, string> = {};
    bodyDiv.find('.row').each((_, row) => {
      const label = $(row).find('.txtbold').text().replace(':', '').trim();
      const value = $(row).find('.col-md-12').not('.txtbold').text().trim();
      if (label && value) detail[label] = value;
    });

    const link = bodyDiv.find('a[href*="ServletDescarga"]').first();
    const href = link.attr('href');
    const pdfUrl = href ? `https://jurisprudencia.pj.gob.pe${href}` : null;
    const params = extractParamsFromA($, index);

    items.push({ recurso, nResolution, pdfUrl, detail, params });
  });
  return items;
}

export function extractDetailHtml(xml: string): string | null {
  const $ = cheerio.load(xml, { xmlMode: true });
  const update = $('update[id="formBuscador:popupResolucion"]');
  if (!update.length) return null;
  return update.text() || null;
}

export function extractPdfLink(html: string): string | null {
  const $ = cheerio.load(html);
  const link = $('a[href*="ServletDescarga"]').first();
  const href = link.attr('href');
  if (!href) return null;
  return `https://jurisprudencia.pj.gob.pe${href}`;
}

export function extractButtonParams(onclick: string): Record<string, string> | null {
  const match = onclick.match(/mojarra\.jsfcljs\([^,]+,\s*\{(.+?)\},\s*\\'\\'\)/);
  if (!match) return null;

  const params: Record<string, string> = {};
  const pairs = match[1].match(/\\'[^\\']+\\'\s*:\s*\\'[^\\']*\\'/g);
  if (pairs) {
    for (const pair of pairs) {
      const sep = pair.indexOf(':');
      const key = pair.slice(2, sep - 2).trim();
      const val = pair.slice(sep + 2, -2).trim();
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
import { getPage, postForm, downloadPdf, postPaginationAjax } from './http.service.js';
import { extractViewState, extractJsessionId, parseXmlToPageResult, extractFormAction, getSearchButtonParams, extractFormFields, buildPaginationParams, extractViewStateFromXml, extractPanelHtml, parsePanelToFilas } from './parser.service.js';
import type { ScraperResult, Fila } from '../types/scraper.types.js';
import { config } from '../config/index.js';

export async function run(busqueda = ''): Promise<ScraperResult> {
  console.log('[1/5] Obteniendo pagina de inicio...');
  const response = await getPage();
  const formAction = extractFormAction(response.data);
  const viewState = extractViewState(response.data);
  const buttonParams = getSearchButtonParams(response.data);
  const formFields = extractFormFields(response.data);

  console.log('  formAction:', formAction);
  console.log('  viewState:', viewState?.slice(0, 30));
  console.log('  buttonParams:', JSON.stringify(buttonParams));

  if (!viewState || !formAction || !buttonParams) {
    console.error('  FALTAN DATOS:', { viewState: !!viewState, formAction: !!formAction, buttonParams: !!buttonParams });
    throw new Error('No se pudo extraer datos del formulario');
  }

  const allParams = {
    ...formFields,
    ...buttonParams,
    'formBuscador:txtBusqueda': busqueda,
  };

  const jsessionid = extractJsessionId(response);
  console.log('  jsessionid:', jsessionid?.slice(0, 20));

  const resultHtml = await postForm(
    new URLSearchParams(allParams).toString(),
    jsessionid,
    formAction,
  );

  const firstPage = parseXmlToPageResult(resultHtml);
  console.log('  totalPages:', firstPage.totalPages);
  console.log('  filas count:', firstPage.filas.length);

  const totalPages = firstPage.totalPages;
  let currentViewState = firstPage.nuevoViewState;
  let filas: Fila[] = firstPage.filas;
  let totalPdfs = 0;

  for (let page = 1; page <= totalPages; page++) {
    console.log(`\n=== Página ${page} de ${totalPages} ===`);

    if (page > 1) {
      const currentFormFields = extractFormFields(resultHtml);
      const pagParams = buildPaginationParams(page, currentViewState, currentFormFields);
      const pagXml = await postPaginationAjax(pagParams.toString(), jsessionid);

      const newViewState = extractViewStateFromXml(pagXml);
      if (newViewState) currentViewState = newViewState;

      const panelHtml = extractPanelHtml(pagXml);
      if (!panelHtml) {
        console.error(`No se pudo extraer panel HTML de página ${page}`);
        continue;
      }
      filas = parsePanelToFilas(panelHtml);
    }

    for (const fila of filas) {
      if (!fila.pdfUrl) {
        console.log(`  Sin PDF: ${fila.recurso} ${fila.nResolution}`);
        continue;
      }

      const safeName = fila.nResolution.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filepath = `${config.pdfDir}/${safeName}.pdf`;

      try {
        await downloadPdf(fila.pdfUrl, filepath, jsessionid);
        totalPdfs++;
        console.log(`  ✓ ${fila.nResolution}`);
      } catch (error) {
        console.error(`  ✗ Error descargando ${fila.nResolution}:`, error);
      }
    }
  }

  console.log(`\nDescargas completadas: ${totalPdfs} PDFs`);

  return {
    success: true,
    filasProcesadas: filas.length,
    pdfsDescargados: totalPdfs,
  };
}

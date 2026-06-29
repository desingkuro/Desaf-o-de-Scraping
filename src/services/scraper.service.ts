import { getPage, postAjax, getParams, postForm } from './http.service.js';
import { extractViewState, extractJsessionId, parseXmlToPageResult, extractFormAction, getSearchButtonParams } from './parser.service.js';
import type { ScraperResult } from '../types/scraper.types.js';

export async function run(): Promise<ScraperResult> {
  const response = await getPage();
  const formAction = extractFormAction(response.data);
  const viewState = extractViewState(response.data);
  const buttonParams = getSearchButtonParams(response.data);

  if (!viewState || !formAction || !buttonParams) {
    throw new Error('No se pudo extraer datos del formulario');
  }
  const allParams = {
    ...buttonParams,
    'formBuscador': 'formBuscador',
    'formBuscador:txtBusqueda': '',
    'javax.faces.ViewState': viewState,
  };

  const jsessionid = extractJsessionId(response);
  let currentViewState = viewState;

  const resultHtml = await postForm(
    new URLSearchParams(allParams).toString(),
    undefined,
    formAction,
  );

  const { nuevoViewState, totalPages, filas } = parseXmlToPageResult(resultHtml);
  console.log({ nuevoViewState, totalPages, filas });

  /*for (let index = 0; index < totalPages; index++) {
    const pageIndex = (index + 1) * 10;
    const typeOption = pageIndex === 10 ? 'postBtn' : 'pagination';
    const params = getParams(typeOption, pageIndex, currentViewState);
    const xml = await postAjax(params.toString(), jsessionid);

    currentViewState = nuevoViewState;
    totalFilas += filas.length;

    console.log(`Pagina ${index + 1}: ${filas.length} filas encontradas`);

    for (const fila of filas) {
      try {
        await downloadPdf(
          jsessionid,
          currentViewState,
          fila.paramUuid,
          fila.btnId,
          `${config.pdfDir}/${fila.nroExpediente}.pdf`,
        );
        totalPdfs++;
      } catch (error) {
        console.error(`Error descargando PDF para ${fila.nroExpediente}:`, error);
      }
    }
  }*/

  return {
    success: true,
    filasProcesadas: 0,
    pdfsDescargados: 0,
  };
}

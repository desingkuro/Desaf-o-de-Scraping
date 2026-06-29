import fs from 'node:fs';
import path from 'node:path';
import { postWithRetry } from './http.service.js';
export async function downloadPdf(jsessionid, viewState, paramUuid, botonId, outputPath) {
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
    const responseData = await postWithRetry(params.toString(), {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `JSESSIONID=${jsessionid}`,
    }, 'arraybuffer', 3, 1000);
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(responseData));
    console.log(`PDF descargado: ${outputPath}`);
}

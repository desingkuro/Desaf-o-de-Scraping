# Scraper Challenge

Scraper para extraer resoluciones judiciales de [jurisprudencia.pj.gob.pe](https://jurisprudencia.pj.gob.pe) y descargar sus PDFs.

## Requisitos

- Docker
- O Node.js 22 + pnpm

## Con Docker

```bash
git clone <repo> && cd scraper-challenge
# crear .env (ver abajo)
docker compose up --build
```

## Sin Docker

```bash
pnpm install
pnpm run dev
```

## Uso

```bash
# buscar "amparo" y descargar TODOS los resultados
curl "http://localhost:3000/api/documents?q=amparo"
```

Los PDFs se guardan en `pdfs/`. Para frenar el proceso solo mata el proceso (Ctrl+C).

## .env

```
PORT=3000
BASE_URL_INICIO=https://jurisprudencia.pj.gob.pe/jurisprudenciaweb/faces/page/inicio.xhtml
BASE_URL=https://jurisprudencia.pj.gob.pe/jurisprudenciaweb/faces/page/resultado.xhtml
```

## Como funciona

1. Hace GET a inicio.xhtml y extrae los campos del formulario
2. Hace POST con los filtros de busqueda
3. Por cada pagina de resultados (paginacion via JSF/RichFaces), extrae los UUIDs y descarga los PDFs
4. Repite hasta que se acaban las paginas

Si el servidor se pone pesado (429), espera y reintenta solo.

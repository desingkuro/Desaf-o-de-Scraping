# Scraper Challenge

Scraper para extraer resoluciones judiciales de [jurisprudencia.pj.gob.pe](https://jurisprudencia.pj.gob.pe) y descargar sus PDFs.

## Requisitos

- Docker (si no quieres instalar nada local)
- O Node.js 22 + pnpm si prefieres correrlo directo

## Con Docker (recomendado para Windows)

```bash
# clonar y entrar
git clone <repo> && cd scraper-challenge

# crear .env (preguntame si no lo tienes)
# y luego:
docker compose up --build
```

Va a quedar escuchando en `http://localhost:3000`.

## Sin Docker

```bash
pnpm install
pnpm run dev
```

## Uso

```bash
# buscar "amparo" y descargar las primeras 3 paginas de resultados
curl "http://localhost:3000/api/documents?q=amparo&pages=3"
```

Los PDFs se guardan en la carpeta `pdfs/`.

## Variables de entorno (.env)

| Variable | Descripcion |
|----------|-------------|
| `PORT` | Puerto del servidor (default 3000) |
| `BASE_URL_INICIO` | URL de la pagina de busqueda |
| `BASE_URL` | URL donde se hacen los AJAX de resultados |
| `MAX_PAGES` | Numero maximo de paginas a procesar (default 5) |

## Como funciona

1. Hace GET a la pagina de inicio y extrae los campos del formulario
2. Hace POST con los filtros de busqueda
3. Por cada pagina de resultados, extrae los UUIDs y descarga los PDFs
4. Repite hasta terminar las paginas configuradas

El sistema de paginacion usa JSF/RichFaces, asi que las peticiones internas son POST con `faces-request: partial/ajax` y todo eso. No hay nada bonito, solo funcional.

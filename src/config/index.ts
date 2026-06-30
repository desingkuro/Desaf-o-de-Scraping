import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL_INICIO!,
  resultUrl: process.env.BASE_URL!,
  pdfDir: './pdfs',
  maxPages: process.env.MAX_PAGES ? parseInt(process.env.MAX_PAGES) : 5,
} as const;

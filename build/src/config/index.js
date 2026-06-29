import 'dotenv/config';
export const config = {
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL,
    pdfDir: './pdfs',
    totalPages: process.env.TOTAL_PAGES ? parseInt(process.env.TOTAL_PAGES) : 683,
};

import { run } from '../services/scraper.service.js';
export async function getDocuments(_req, res, next) {
    try {
        const result = await run();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}

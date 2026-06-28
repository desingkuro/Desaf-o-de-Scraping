import express from 'express';
import scrapeDocuments from './routes/scraper.js';
import { errorHandler } from './middleware/middleware.js';
import 'dotenv/config';
const app = express();
const port = process.env.PORT || 3000;
// middleware for routes
app.use('/api', scrapeDocuments);
app.use('/api/test', (req, res) => {
    console.log(req);
    res.send('Test endpoint');
});
app.use(errorHandler);
// Server listening
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
export default server;

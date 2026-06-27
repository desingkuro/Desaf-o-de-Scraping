import { errorHandler } from "./middleware/middleware";
import express from 'express';
import bodyParser from 'body-parser';
import scrapeDocuments from './routes/scraper';

const app = express();
const port: string | number = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// middleware for routes
app.use('/', scrapeDocuments);
app.use(errorHandler);

// Server listening
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default server;

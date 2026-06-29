import express from 'express';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import 'dotenv/config';
const app = express();
const port = process.env.PORT || 3000;
app.use('/api', routes);
app.use(errorHandler);
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
export default server;

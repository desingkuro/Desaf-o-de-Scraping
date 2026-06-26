const express = require('express');
const bodyParser = require('body-parser');
const scrapeDocuments = require('./routes/scraper');


const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// middleware for routes
app.use('/', scrapeDocuments);

// Server listening
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export server for testing
export default server;

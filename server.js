const express = require('express');
const { connectDB } = require('./config/db');
const routes = require('./config/routes');

const app = express();
const port = 5000;

// Connect to the database
connectDB();

// Use routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

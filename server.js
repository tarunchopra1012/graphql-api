const express = require('express');
const { connectDB } = require('./config/db');
const { getUsers } = require('./controllers/usersController');

const app = express();
const port = 5000;

// Connect to the database
connectDB();

// Routes
app.get('/', getUsers);

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const requireAuth = require('./middleware/requireAuth');
const ErrorHandler = require('./middleware/errorHandler');
const userRoutes = require('./Routes/userRoutes');
const matkakohdeRoutes = require('./Routes/matkakohteetRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//http://localhost:4000/

app.use('/api/user', userRoutes);
app.use('/api/matkakohde', matkakohdeRoutes);

app.use(ErrorHandler);

mongoose
  .connect(process.env.DB_CONNECTION_STRING)
  .then(() => {
    console.log('Yhdistetty databaseen');
  })
  .catch((err) => console.error(err));

module.exports = app;

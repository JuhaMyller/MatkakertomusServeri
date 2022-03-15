const express = require('express');
const { get } = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();

const userRoutes = require('./Route/userRoute');

app.use(express.json());

//http://localhost:3000/

app.use('/api/user', userRoutes);

app.use((error, req, res, next) => {
  const { statusCode } = error;
  console.log(error.message);
  res.status(statusCode).json({ message: error.message });
});

mongoose.connect(process.env.DB_CONNECTION_STRING).then(() => {
  console.log('Yhdistetty databaseen');
  app.listen(3000, () => {
    console.log('Serveri on käynnissä');
  });
});

//ohjelmistotuotanto2@gmail.com
//ploro2022

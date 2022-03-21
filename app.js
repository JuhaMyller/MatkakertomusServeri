const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const requireAuth = require('./middleware/requireAuth');
const ErrorHandler = require('./middleware/errorHandler');
const userRoutes = require('./Route/userRoute');

app.use(express.json());

//http://localhost:4000/

app.use('/api/user', userRoutes);

//testiroute
app.use('/privateRoute', requireAuth, (req, res) => {
  res.status(200).json({ userid: req.userID, sposti: req.sposti });
});

app.use(ErrorHandler);

mongoose.connect(process.env.DB_CONNECTION_STRING).then(() => {
  console.log('Yhdistetty databaseen');
});

module.exports = app;

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const requireAuth = require('./middleware/requireAuth');

const userRoutes = require('./Route/userRoute');

app.use(express.json());

//http://localhost:3000/

app.use('/api/user', userRoutes);

app.use('/privateRoute', requireAuth, (req, res) => {
  res.status(200).json({ userid: req.userID, sposti: req.sposti });
});

app.use((error, req, res, next) => {
  const { statusCode } = error;
  console.log(error.message);
  res.status(statusCode).json({ message: error.message });
});

mongoose.connect(process.env.DB_CONNECTION_STRING).then(() => {
  console.log('Yhdistetty databaseen');
  app.listen(process.env.PORT || 3002, () => {
    console.log(`Serveri on käynnissä portissa ${process.env.PORT || 3002}`);
  });
});

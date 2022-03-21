const app = require('./app');

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Serveri on käynnissä portissa ${port}`);
});

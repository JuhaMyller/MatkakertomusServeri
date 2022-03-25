const mongoose = require('mongoose');

const Matkakohde = mongoose.Schema({
  kohdenimi: {
    type: String,
    required: true,
  },
  maa: {
    type: String,
    required: true,
  },
  paikkakunta: {
    type: String,
    required: true,
  },
  kuvateksti: {
    type: String,
    required: true,
  },
  kuva: {
    nimi: { type: String, required: true },
    path: { type: String, required: true },
  },
});

module.exports = mongoose.model('Matkakohde', Matkakohde);

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
    type: String,
  },
  tarinat: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tarina',
    },
  ],
});

module.exports = mongoose.model('Matkakohde', Matkakohde);

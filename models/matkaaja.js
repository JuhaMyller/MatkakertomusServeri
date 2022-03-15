const mongoose = require('mongoose');

const MatkaajaSchema = mongoose.Schema({
  etunimi: {
    type: String,
    required: true,
    maxlength: 15,
  },
  sukunimi: {
    type: String,
    required: true,
    maxlength: 20,
  },
  nimimerkki: {
    type: String,
    required: true,
    maxlength: 15,
    unique: true,
  },
  paikkakunta: {
    type: String,
    required: true,
  },
  esittely: {
    type: String,
    required: true,
  },
  kuva: {
    type: String,
  },
  sposti: {
    type: String,
    required: true,
    unique: true,
  },
  salasana: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Matkaaja', MatkaajaSchema);

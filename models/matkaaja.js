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
  },
  esittely: {
    type: String,
  },
  kuva: {
    nimi: { type: String },
    path: { type: String },
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
  refreshToken: { type: String },
  palautaSposti: {
    token: { type: String },
    expiresAt: { type: Date },
  },
});

module.exports = mongoose.model('Matkaaja', MatkaajaSchema);

const Matkaaja = require('../models/matkaaja');
const bcrypt = require('bcrypt');

module.exports.register = async (req, res, next) => {
  try {
    const { etunimi, sukunimi, paikkakunta } = req.body;
    const { esittely, sposti, nimimerkki, salasana } = req.body;

    const user = await Matkaaja.findOne({
      $or: [{ sposti: sposti.toLowerCase() }, { nimimerkki: nimimerkki }],
    });

    if (user) {
      const arr = [];
      if (user.sposti === sposti.toLowerCase())
        arr.push('Sposti on jo käytössä');
      if (user.nimimerkki === nimimerkki) arr.push('nimimerkki on jo käytössä');
      return res.status(400).json({ message: arr });
    }

    const hashPass = await bcrypt.hash(salasana, 10);

    const uusiMatkaaja = new Matkaaja({
      etunimi: etunimi.charAt(0).toUpperCase() + etunimi.slice(1),
      sukunimi: sukunimi.charAt(0).toUpperCase() + sukunimi.slice(1),
      paikkakunta: paikkakunta.charAt(0).toUpperCase() + paikkakunta.slice(1),
      esittely,
      sposti: sposti.toLowerCase(),
      nimimerkki,
      salasana: hashPass,
    });

    const response = await uusiMatkaaja.save();

    console.log(response);

    if (response) res.status(200).json({ message: 'OK' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

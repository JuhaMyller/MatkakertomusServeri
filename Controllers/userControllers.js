const Matkaaja = require('../models/matkaaja');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const reqParams = require('../utils/requestParams');
const ErrorHandler = require('../utils/ErrorHandler');

module.exports.register = async (req, res, next) => {
  try {
    const { etunimi, sukunimi, sposti, nimimerkki, salasana } = req.body;

    const haveParams = reqParams(
      {
        etunimi,
        sukunimi,
        sposti,
        nimimerkki,
        salasana,
      },
      req.body
    );

    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

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
      sposti: sposti.toLowerCase(),
      nimimerkki,
      salasana: hashPass,
    });

    const response = await uusiMatkaaja.save();

    if (response) res.status(201).json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};
module.exports.login = async (req, res, next) => {
  try {
    const { sposti, salasana } = req.body;

    const haveParams = reqParams({ sposti, salasana }, req.body);

    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

    const user = await Matkaaja.findOne({
      sposti: sposti.toLowerCase(),
    }).exec();

    if (!user)
      return res
        .status(400)
        .json({ message: 'Sposti tai salasana on virheellinen' });

    const hashedPass = await bcrypt.compare(salasana, user.salasana);

    if (!hashedPass)
      return res
        .status(400)
        .json({ message: 'Sposti tai salasana on virheellinen' });

    const accessToken = jwt.sign(
      {
        id: user.id,
        sposti: user.sposti.toLowerCase(),
      },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '8h' }
    );
    const refreshToken = jwt.sign(
      {
        id: user.id,
        sposti: user.sposti.toLowerCase(),
      },
      process.env.REFRESH_TOKEN_KEY,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    res.status(200).json({
      message: 'OK',
      user: {
        etunimi: user.etunimi,
        sukunimi: user.sukunimi,
        sposti: user.sposti,
        nimimerkki: user.nimimerkki,
        kuva: user.kuva,
        esittely: user.esittely,
        paikkakunta: user.paikkakunta,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

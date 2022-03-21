const Matkaaja = require('../models/matkaaja');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const reqParams = require('../utils/requestParams');
const ErrorHandler = require('../utils/ErrorHandler');
const { validationResult } = require('express-validator');

module.exports.register = async (req, res, next) => {
  try {
    //validation middleware joka tulee express-validator packagesta
    //toimii userRoutes kansiossa register routessa
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ErrorHandler(400, errors.array());
    }
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

    //regex nimimerkki pitää suuria ja pieniä kirjaimia yhdenveroisina =>
    //ei voi laittaa esim MarPuu ja marpuu nimimerkkiä enää mongodb

    const regexNimimerkki = `^${nimimerkki}$`;
    const user = await Matkaaja.find({
      $or: [
        { sposti: sposti.toLowerCase() },
        { nimimerkki: { $regex: regexNimimerkki, $options: 'i' } },
      ],
    });

    //.find palauttaa aina arrayn vaikka se olisi tyhjä

    if (user.length > 0) {
      const arr = [];

      user.find((u) => {
        if (u.sposti === sposti.toLowerCase())
          arr.push('Sposti on jo käytössä');
        if (u.nimimerkki.toLowerCase() === nimimerkki.toLowerCase())
          arr.push('nimimerkki on jo käytössä');
      });

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

module.exports.editProfile = async (req, res, next) => {
  try {
    const { etunimi, sukunimi, paikkakunta, esittely, sposti } = req.body;

    const haveParams = reqParams(
      { etunimi, sukunimi, paikkakunta, esittely, sposti },
      req.body
    );

    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

    const user = await Matkaaja.findById(req.userID);

    if (user.sposti !== sposti.toLowerCase()) {
      //jos sposti vaihdetaan niin tarkistaa onko sposti vapaana
      const spostiCheck = await Matkaaja.findOne({
        sposti: sposti.toLowerCase(),
      });

      if (spostiCheck)
        return res.status(400).json({ message: 'Sposti on jo käytössä' });
    }

    if (user) {
      user.etunimi = etunimi.charAt(0).toUpperCase() + etunimi.slice(1);
      user.sukunimi = sukunimi.charAt(0).toUpperCase() + sukunimi.slice(1);
      user.paikkakunta = paikkakunta;
      user.esittely = esittely;
      user.sposti = sposti.toLowerCase();

      const savedUser = await user.save();
      res.status(200).json({
        message: 'OK',
        user: {
          etunimi: savedUser.etunimi,
          sukunimi: savedUser.sukunimi,
          paikkakunta: savedUser.paikkakunta,
          esittely: savedUser.esittely,
          sposti: savedUser.sposti,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.changePassword = async (req, res, next) => {
  try {
    //validation middleware joka tulee express-validator packagesta
    //toimii userRoutes kansiossa register routessa
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ErrorHandler(400, errors.errors[0]['msg']);
    }
    const { uusiSalasana, salasana } = req.body;

    const haveParams = reqParams({ uusiSalasana, salasana }, req.body);

    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

    //etsitään käyttäjä requireAuth middlewaren antamasta id:stä joka otettiin JWT
    const user = await Matkaaja.findById(req.userID);
    //vertaillaan tietokannassa olevaa salasanaa requestissa olevaan salasanaan
    const hashedPass = await bcrypt.compare(salasana, user.salasana);

    if (!hashedPass)
      return res.status(400).json({ message: 'Salasana on virheellinen' });

    //Hashataan salasana ja tallennetaan tietokantaan
    const hashPass = await bcrypt.hash(uusiSalasana, 10);
    user.salasana = hashPass;
    await user.save();

    res.status(200).json({
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
};

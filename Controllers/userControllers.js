const Matkaaja = require('../models/matkaaja');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const reqParams = require('../utils/requestParams');
const ErrorHandler = require('../utils/ErrorHandler');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { deleteFile, upload } = require('../utils/AWS_s3');

module.exports.register = async (req, res, next) => {
  try {
    //validation middleware joka tulee express-validator packagesta
    //toimii userRoutes kansiossa register routessa
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors.array().map((e) => e.msg);
      return ErrorHandler(400, err);
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
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      {
        id: user.id,
        sposti: user.sposti.toLowerCase(),
      },
      process.env.REFRESH_TOKEN_KEY,
      { expiresIn: '8h' }
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
    const user = await Matkaaja.findById(req.userID).exec();
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

module.exports.sendResetPasswordEmail = async (req, res, next) => {
  try {
    const { sposti } = req.body;

    const haveParams = reqParams({ sposti }, req.body);

    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

    //Etsitään onko käyttäjä olemassa
    const user = await Matkaaja.findOne({
      sposti: sposti.toLowerCase(),
    }).exec();

    if (!user) {
      return res.status(400).json({
        message: 'Sähköpostia ei ole olemassa',
      });
    }

    //Luodaan palautusavain spostille
    const token = crypto.randomBytes(48).toString('hex');

    //Tokeni on voimassa tunnin ajan
    const date = new Date();
    date.setHours(date.getHours() + 1);
    //Annetaan käyttäjälle token ja päättymisaika
    user.palautaSposti.token = token;
    user.palautaSposti.expiresAt = date;
    const saveToken = await user.save();
    //Varmistetaan että käyttäjälle tallennettiin tiedot
    if (!saveToken) ErrorHandler(500, 'Server error');
    //Luodaan viesti joka lähetetään spostiin => viestissä on linkki frontendiin palauta salasana sivulle. Frontedissä luetaan querysta token ja sposti
    const message = `Salasanan palautuslinkki http://localhost:3000/palautasalasana?token=${token}&email=${user.sposti} \nPalautuslinkki on voimassa tunnin`;
    //Lähetetään sposti utils kansioon luodulla functiolla
    await sendEmail(user.sposti, message);

    res.status(200).json({
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
};

module.exports.resetPasswordToken = async (req, res, next) => {
  try {
    const { sposti, salasana, token } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ErrorHandler(400, errors.array());
    }

    const haveParams = reqParams({ sposti, salasana, token }, req.body);

    if (!haveParams) ErrorHandler(400, 'Params puuttuu');
    //Etsitään käyttäjä spostin perusteella
    const user = await Matkaaja.findOne({
      sposti: sposti.toLowerCase(),
    }).exec();
    if (!user)
      return res.status(400).json({
        message: 'Virheellinen sposti ja token yhdistelmä',
      });

    //Tarkistetaan onko clientiltä saatu token sama kuin tietokannassa käyttäjällä
    if (user.palautaSposti['token'] !== token)
      return res.status(400).json({
        message: 'Virheellinen sposti ja token yhdistelmä',
      });
    const date = new Date();
    //Jos token on vanhentunut poistetaan token ja aika ja ei tehdä muutoksia salasanaan
    if (date > user.palautaSposti['expiresAt']) {
      user.palautaSposti = undefined;
      await user.save();
      return res.status(400).json({
        message: 'Token on vanhentunut',
      });
    }

    //Hashataan salasana ja tallennetaan käyttäjälle uusi salasana
    //ja poistetaan käyttäjältä token
    const hashPass = await bcrypt.hash(salasana, 10);

    user.salasana = hashPass;
    user.palautaSposti = undefined;
    await user.save();

    res.status(200).json({
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
};

module.exports.changeProfilePic = async (req, res, next) => {
  try {
    if (!req.file) ErrorHandler(400, 'Kuvatiedosto puuttuu');

    const user = await Matkaaja.findById(req.userID).exec();
    //Jos edellinen kuva on olemassa se poistetaan
    if (user?.kuva) {
      await deleteFile([{ Key: user.kuva }]);
    }

    await upload(req.file);

    user.kuva = req.file['filename'];

    await user.save();

    //palautetaan kuva clientille
    res.status(200).json({
      message: 'OK',
      kuva: req.file['filename'],
    });
  } catch (error) {
    next(error);
  }
};

module.exports.removeProfilePic = async (req, res, next) => {
  try {
    const user = await Matkaaja.findById(req.userID).exec();

    if (!user.kuva) {
      return res.status(404).json({
        message: 'Kuvaa ei löytynyt',
      });
    }
    //Jos kuva on olemassa se poistetaan

    await deleteFile([{ Key: user.kuva }]);

    user.kuva = undefined;

    await user.save();

    res.status(200).json({
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
};

module.exports.logout = async (req, res, next) => {
  try {
    const user = await Matkaaja.findById(req.userID).exec();

    if (!user) ErrorHandler(404, 'Käyttäjää ei löytynyt');

    user.refreshToken = undefined;
    await user.save();

    res.cookie('refreshToken', '', {
      maxAge: 1000,
      httpOnly: true,
    });

    res.status(200).json({
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
};

module.exports.refreshToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken)
      return res.status(401).json({ message: 'Refreshtoken puuttuu' });

    const refreshToken = cookies.refreshToken;

    const user = await Matkaaja.findOne({ refreshToken: refreshToken }).exec();
    if (!user) {
      res.clearCookie('refreshToken', {
        maxAge: 1,
        httpOnly: true,
      });
      return res
        .status(403)
        .json({ message: 'Antamaa refreshtokenia ei löytynyt' });
    }

    jwt.verify(
      user.refreshToken,
      process.env.REFRESH_TOKEN_KEY,
      async (err, decoded) => {
        if (err || user.id !== decoded.id) {
          res.clearCookie('refreshToken', {
            maxAge: 1,
            httpOnly: true,
          });
          user.refreshToken = undefined;
          await user.save();
          return res.status(403).json({ message: 'Virheellinen token' });
        }
        // req.userID = decoded.id;

        const accessToken = jwt.sign(
          {
            sposti: decoded.sposti,
            id: decoded.id,
          },
          process.env.ACCESS_TOKEN_KEY,
          { expiresIn: '15m' }
        );

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
      }
    );
  } catch (err) {
    next(err);
  }
};

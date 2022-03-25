const Matkakohde = require('../models/matkakohde');
require('dotenv').config();
const reqParams = require('../utils/requestParams');
const ErrorHandler = require('../utils/ErrorHandler');
const { s3Client } = require('../utils/AWS_s3');
const multer = require('../middleware/multerS3');

module.exports.uusiMatkakohde = async (req, res, next) => {
  try {
    const { kohdenimi, maa, paikkakunta, kuvateksti } = req.body;
    if (!req.file) ErrorHandler(400, 'Kuvatiedosto puuttuu');
    const haveParams = reqParams(
      {
        kohdenimi,
        maa,
        paikkakunta,
        kuvateksti,
      },
      req.body
    );
    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

    const matkakohde = await Matkakohde.findOne({
      kohdenimi: kohdenimi.toLowerCase(),
    }).exec();
    if (matkakohde) return ErrorHandler(400, 'Matkakohde on jo olemassa');

    const uusiMatkakohde = new Matkakohde({
      kohdenimi: kohdenimi.toLowerCase(),
      maa: maa.toLowerCase(),
      paikkakunta: paikkakunta.toLowerCase(),
      kuvateksti,
      kuva: { nimi: req.file['key'], path: req.file['location'] },
    });
    const response = await uusiMatkakohde.save();
    if (response) res.status(201).json({ message: 'OK' });
  } catch (error) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: req.file['key'],
    };
    await s3Client.deleteObject(params).promise();
    next(error);
  }
};

module.exports.matkakohteet = async (req, res, next) => {
  try {
    const matkakohteet = await Matkakohde.find().exec();

    res.status(200).json({ message: 'OK', matkakohteet });
  } catch (error) {
    next(error);
  }
};

module.exports.matkakohteetID = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return ErrorHandler(400, 'ID puuttuu');
    const matkakohteet = await Matkakohde.findById(id).exec();

    if (!matkakohteet) return ErrorHandler(400, 'Virheellinen id');

    res.status(200).json({ message: 'OK', matkakohteet });
  } catch (error) {
    next(error);
  }
};
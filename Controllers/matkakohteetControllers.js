const Matkakohde = require('../models/matkakohde');
require('dotenv').config();
const reqParams = require('../utils/requestParams');
const ErrorHandler = require('../utils/ErrorHandler');
const { upload, deleteFile } = require('../utils/AWS_s3');

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

    await upload(req.file);

    const uusiMatkakohde = new Matkakohde({
      kohdenimi: kohdenimi.toLowerCase(),
      maa: maa.toLowerCase(),
      paikkakunta: paikkakunta.toLowerCase(),
      kuvateksti,
      kuva: req.file['filename'],
    });
    const response = await uusiMatkakohde.save();

    if (response)
      res.status(201).json({
        message: 'OK',
        uusiMatkakohde,
      });
  } catch (error) {
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
    const matkakohteet = await Matkakohde.findById(id);

    if (!matkakohteet) return ErrorHandler(400, 'Virheellinen id');

    res.status(200).json({ message: 'OK', matkakohteet });
  } catch (error) {
    next(error);
  }
};
module.exports.muokkaaMatkakohdetta = async (req, res, next) => {
  try {
    const { kohdenimi, maa, paikkakunta, id, kuvateksti } = req.body;

    res.status(200).json({});
  } catch (error) {
    next(error);
  }
};

module.exports.poistaMatkakohde = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!id) ErrorHandler(400, 'Id puuttuu');

    const matkakohde = await Matkakohde.findById(id);

    if (!matkakohde) ErrorHandler(400, 'Matkakohdetta ei ole olemassa');
    if (matkakohde.tarinat.length !== 0)
      ErrorHandler(400, 'Matkakohteella on tarinoita');

    const remove = await matkakohde.remove();
    await deleteFile([{ Key: matkakohde.kuva }]);

    res.status(200).json({ matkakohde: remove.id });
  } catch (error) {
    next(error);
  }
};

const Tarina = require('../models/tarina');
const Matkakohde = require('../models/matkakohde');
const reqParams = require('../utils/requestParams');
const ErrorHandler = require('../utils/ErrorHandler');
const { upload } = require('../utils/AWS_s3');

module.exports.uusiTarina = async (req, res, next) => {
  try {
    const { matkakohde, yksityinen, teksti } = req.body;
    const { alkupvm, loppupvm } = req.body;

    if (!req.files) ErrorHandler(400, 'Kuvatiedosto puuttuu');
    const haveParams = reqParams(
      { matkakohde, yksityinen, teksti, alkupvm, loppupvm },
      req.body
    );
    if (!haveParams) ErrorHandler(400, 'Params puuttuu');

    //Halutaan tarkistaa onko Matkakohdetta olemassa
    const matkakohdeExists = await Matkakohde.findById(matkakohde);

    if (!matkakohdeExists)
      return ErrorHandler(400, 'Matkakohdetta ei ole olemassa');

    const tarinaImgs = [];

    for (let index = 0; index < req.files.length; index++) {
      const singleImg = await upload(req.files[index]);
      tarinaImgs.push(singleImg.Key);
    }

    const tarina = new Tarina({
      matkaaja: req.userID,
      matkakohde,
      yksityinen,
      teksti,
      alkupvm,
      loppupvm,
      kuva: tarinaImgs,
    });

    const savedTarina = await tarina.save();
    matkakohdeExists.tarinat.push(savedTarina.id);
    await matkakohdeExists.save();

    res.status(201).json({ message: 'OK', savedTarina });
  } catch (error) {
    next(error);
  }
};

module.exports.tarinatID = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return ErrorHandler(400, 'ID puuttuu');
    const tarina = await Matkakohde.findById(id).exec();

    if (!tarina) return ErrorHandler(400, 'Virheellinen id');

    res.status(200).json({ message: 'OK', tarina });
  } catch (error) {
    next(error);
  }
};

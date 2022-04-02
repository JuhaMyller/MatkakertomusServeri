const { Router } = require('express');
const router = Router();
const matkakohteetControllers = require('../Controllers/matkakohteetControllers');
const requireAuth = require('../middleware/requireAuth');
const multer = require('../middleware/multer');

//http://localhost:4000/api/matkakohde

router.post(
  '/matkakohde',
  multer.single('kuva'),
  matkakohteetControllers.uusiMatkakohde
);
//palauttaa nyt kaikki matkakohteen tiedot
router.get('/matkakohteet', matkakohteetControllers.matkakohteet);
//pitäisi myöhemmin palauttaa matkakohde sekä siihen liitetyt tarinat
router.get('/matkakohteet/:id', matkakohteetControllers.matkakohteetID);

router.put('/matkakohteet', matkakohteetControllers.muokkaaMatkakohdetta);

module.exports = router;

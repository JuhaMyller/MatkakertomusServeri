const { Router } = require('express');
const router = Router();
const tarinatController = require('../Controllers/tarinatController');
const multer = require('../middleware/multer');

//http://localhost:4000/api/tarina

router.post('/tarina', multer.array('kuva', 12), tarinatController.uusiTarina);
router.get('/tarina/:id', tarinatController.tarinatID);

module.exports = router;

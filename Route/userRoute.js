const { Router } = require('express');
const router = Router();
const userController = require('../Controllers/userControllers');
const { body } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');

//http://localhost:4000/api/user

router.post(
  '/register',
  body('sposti').isEmail().withMessage('Sposti on virheellinen'),
  body('salasana')
    .isLength({ min: 5, max: 15 })
    .withMessage('Salasanan täytyy olla 5-15 merkkiä pitkä'),
  userController.register
);

router.post('/login', userController.login);

//kaikki muut tiedot paitsi  salasana, kuva, nimimerkki
router.put('/editprofile', requireAuth, userController.editProfile);

router.put(
  '/changepassword',
  requireAuth,
  body('uusiSalasana')
    .isLength({ min: 5, max: 15 })
    .withMessage('Salasanan täytyy olla 5-15 merkkiä pitkä'),
  userController.changePassword
);

module.exports = router;

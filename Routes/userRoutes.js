const { Router } = require('express');
const router = Router();
const userController = require('../Controllers/userControllers');
const { body } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');
const multer = require('../middleware/multer');
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

router.post('/sendresetpassemail', userController.sendResetPasswordEmail);
router.put(
  '/resetpasstoken',
  body('salasana')
    .isLength({ min: 5, max: 15 })
    .withMessage('Salasanan täytyy olla 5-15 merkkiä pitkä'),
  userController.resetPasswordToken
);

router.post(
  '/setprofilepic',
  requireAuth,
  multer.single('kuva'),
  userController.changeProfilePic
);
router.delete(
  '/removeprofilepic',
  requireAuth,
  userController.removeProfilePic
);

router.post('/logout', requireAuth, userController.logout);

module.exports = router;

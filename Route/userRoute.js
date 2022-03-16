const { Router } = require('express');
const router = Router();
const userController = require('../Controllers/userControllers');

//http://localhost:3000/api/user

router.post('/register', userController.register);
router.post('/login', userController.login);

module.exports = router;

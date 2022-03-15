const { Router } = require('express');
const router = Router();
const userController = require('../Controllers/userControllers');

//http://localhost:3000/api/user

router.post('/register', userController.register);

module.exports = router;

// axios.post('http://localhost:3000/api/user', {
//     username: "Marek",
//     password: "Markkumies"
// });

// axios.get('http://localhost:3000/api/user?username=Marek&password=markkumies');

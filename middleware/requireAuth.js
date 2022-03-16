const jwt = require('jsonwebtoken');
require('dotenv').config();

const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(401).json({ message: 'Ei kirjauduttu sisään' });

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Virheellinen token' });
    req.userID = decoded.id;
    req.sposti = decoded.sposti;
    next();
  });
};

module.exports = requireAuth;

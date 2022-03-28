const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'image-' + uuidv4() + '.jpeg');
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
    cb(null, true);
  else cb(null, false);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;

const express = require('express');
const multer = require('multer');
const { uploadProfilePicture } = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/authMiddleware');
const { AppError } = require('../utils/AppError');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
      return;
    }
    callback(null, true);
  },
});

router.post('/profile-picture', authenticate, upload.single('image'), uploadProfilePicture);

module.exports = router;

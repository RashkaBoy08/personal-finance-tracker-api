const express = require('express');
const { listCategories } = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticate, listCategories);

module.exports = router;

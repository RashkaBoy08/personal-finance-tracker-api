const express = require('express');
const { getOverview } = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/overview', authenticate, requireAdmin, getOverview);

module.exports = router;

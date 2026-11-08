const express = require('express');
const {
  createTransaction,
  listTransactions,
  getMonthlySummary,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/monthly-summary', authenticate, getMonthlySummary);
router.post('/', authenticate, createTransaction);
router.get('/', authenticate, listTransactions);
router.put('/:id', authenticate, updateTransaction);
router.delete('/:id', authenticate, deleteTransaction);

module.exports = router;

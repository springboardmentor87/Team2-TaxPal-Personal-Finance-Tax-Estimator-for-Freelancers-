const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createTransaction,
  deleteTransaction,
  getAnalytics,
  getTransaction,
  getTransactions,
  updateTransaction
} = require('../controllers/transactionController');

const router = express.Router();

router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
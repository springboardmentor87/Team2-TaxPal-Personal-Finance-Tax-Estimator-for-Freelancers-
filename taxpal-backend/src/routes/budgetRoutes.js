const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createBudget,
  deleteBudget,
  getAnalytics,
  getBudget,
  getBudgets,
  updateBudget
} = require('../controllers/budgetController');

const router = express.Router();

router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/', getBudgets);
router.get('/:id', getBudget);
router.post('/', createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createBudget,
  deleteBudget,
  getAnalytics,
  getBudget,
  getBudgets,
  getProgress,
  updateBudget
} = require('../controllers/budgetController');

const router = express.Router();

router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/progress', getProgress);
router.get('/', getBudgets);
router.get('/:id', getBudget);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
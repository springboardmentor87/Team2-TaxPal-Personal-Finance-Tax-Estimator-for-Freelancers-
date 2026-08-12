const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createCategory,
  deleteCategory,
  getAnalytics,
  getCategory,
  getCategories,
  updateCategory
} = require('../controllers/categoryController');

const router = express.Router();

router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
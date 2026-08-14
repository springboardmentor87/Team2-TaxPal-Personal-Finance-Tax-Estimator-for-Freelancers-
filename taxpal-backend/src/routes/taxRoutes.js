const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  calculateQuarterlyTax,
  getTaxCalendar,
  getTaxEstimate
} = require('../controllers/taxController');

const router = express.Router();

router.use(protect);
router.get('/', getTaxEstimate);
router.get('/estimate', getTaxEstimate);
router.post('/calculate', calculateQuarterlyTax);
router.get('/calendar', getTaxCalendar);

module.exports = router;
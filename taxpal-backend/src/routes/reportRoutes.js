const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  downloadDashboardReport,
  downloadTaxReport,
  downloadTransactionsReport
} = require('../controllers/reportController');

const router = express.Router();

router.use(protect);
router.get('/transactions', downloadTransactionsReport);
router.get('/dashboard', downloadDashboardReport);
router.get('/tax', downloadTaxReport);

module.exports = router;
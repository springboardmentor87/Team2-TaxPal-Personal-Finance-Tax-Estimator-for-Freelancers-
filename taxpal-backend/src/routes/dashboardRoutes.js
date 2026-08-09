const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
	getDashboardAnalytics,
	getDashboardSummary,
	getSpendingBreakdown
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.get('/', getDashboardSummary);
router.get('/analytics', getDashboardAnalytics);
router.get('/spending-breakdown', getSpendingBreakdown);
router.get('/summary', getDashboardSummary);

module.exports = router;
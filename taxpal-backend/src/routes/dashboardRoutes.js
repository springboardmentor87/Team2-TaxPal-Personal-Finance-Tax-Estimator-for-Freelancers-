const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getDashboardAnalytics, getDashboardSummary } = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.get('/analytics', getDashboardAnalytics);
router.get('/summary', getDashboardSummary);

module.exports = router;
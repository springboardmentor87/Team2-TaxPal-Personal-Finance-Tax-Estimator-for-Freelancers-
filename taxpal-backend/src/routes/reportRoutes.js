const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  deleteReport,
  downloadDashboardReport,
  downloadReportById,
  downloadTaxReport,
  downloadTransactionsReport,
  generateReport,
  getReports,
  previewReport
} = require('../controllers/reportController');

const router = express.Router();

router.use(protect);

// Milestone 4 Reports CRUD & Generation
router.get('/', getReports);
router.post('/', generateReport);
router.post('/generate', generateReport);
router.get('/:id/download', downloadReportById);
router.get('/:id/preview', previewReport);
router.delete('/:id', deleteReport);

// Direct download endpoints
router.get('/transactions', downloadTransactionsReport);
router.get('/dashboard', downloadDashboardReport);
router.get('/tax', downloadTaxReport);

module.exports = router;
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  getDashboardAnalytics: getDashboardAnalyticsService,
  getDashboardSummary: getDashboardSummaryService,
  getSpendingBreakdown: getSpendingBreakdownService
} = require('../services/dashboardService');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummaryService(req.userId);
  return sendSuccess(res, 200, 'Dashboard summary fetched successfully', summary);
});

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalyticsService(req.userId);
  return sendSuccess(res, 200, 'Dashboard analytics fetched successfully', analytics);
});

const getSpendingBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await getSpendingBreakdownService(req.userId);
  return sendSuccess(res, 200, 'Spending breakdown fetched successfully', breakdown);
});

module.exports = {
  getDashboardAnalytics,
  getDashboardSummary,
  getSpendingBreakdown
};
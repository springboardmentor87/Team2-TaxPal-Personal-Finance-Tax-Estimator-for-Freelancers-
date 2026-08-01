const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  getDashboardAnalytics: getDashboardAnalyticsService,
  getDashboardSummary: getDashboardSummaryService
} = require('../services/dashboardService');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummaryService(req.userId);
  return sendSuccess(res, 200, 'Dashboard summary fetched successfully', summary);
});

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalyticsService(req.userId);
  return sendSuccess(res, 200, 'Dashboard analytics fetched successfully', analytics);
});

module.exports = {
  getDashboardAnalytics,
  getDashboardSummary
};
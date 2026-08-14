const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const { calculateQuarterlyTax, getTaxCalendar, getTaxEstimate } = require('../services/taxService');

const getTaxEstimateController = asyncHandler(async (req, res) => {
  const estimate = await getTaxEstimate(req.userId, req.query);
  return sendSuccess(res, 200, 'Tax estimate fetched successfully', estimate);
});

const calculateQuarterlyTaxController = asyncHandler(async (req, res) => {
  const result = await calculateQuarterlyTax(req.userId, req.body);
  return sendSuccess(res, 200, 'Quarterly tax calculated successfully', result);
});

const getTaxCalendarController = asyncHandler(async (req, res) => {
  const calendar = await getTaxCalendar(req.userId, req.query.year);
  return sendSuccess(res, 200, 'Tax calendar fetched successfully', calendar);
});

module.exports = {
  calculateQuarterlyTax: calculateQuarterlyTaxController,
  getTaxCalendar: getTaxCalendarController,
  getTaxEstimate: getTaxEstimateController
};
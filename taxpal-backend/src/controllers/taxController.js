const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const { getTaxEstimate } = require('../services/taxService');

const getTaxEstimateController = asyncHandler(async (req, res) => {
  const estimate = await getTaxEstimate(req.userId, req.query);
  return sendSuccess(res, 200, 'Tax estimate fetched successfully', estimate);
});

module.exports = {
  getTaxEstimate: getTaxEstimateController
};
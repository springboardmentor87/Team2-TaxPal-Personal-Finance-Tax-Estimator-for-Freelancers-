const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  createBudget: createBudgetService,
  deleteBudget: deleteBudgetService,
  getBudgetAnalytics,
  getBudgetById,
  getBudgetOverview,
  listBudgets,
  updateBudget: updateBudgetService
} = require('../services/budgetService');
const { refreshAlerts } = require('../services/alertService');

const createBudget = asyncHandler(async (req, res) => {
  const budget = await createBudgetService(req.userId, req.body);
  await refreshAlerts(req.userId);
  return sendSuccess(res, 201, 'Budget created successfully', budget);
});

const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await listBudgets(req.userId);
  const overview = await getBudgetOverview(req.userId);
  return sendSuccess(res, 200, 'Budgets fetched successfully', {
    items: budgets,
    overview
  });
});

const getBudget = asyncHandler(async (req, res) => {
  const budget = await getBudgetById(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Budget fetched successfully', budget);
});

const updateBudget = asyncHandler(async (req, res) => {
  const budget = await updateBudgetService(req.userId, req.params.id, req.body);
  await refreshAlerts(req.userId);
  return sendSuccess(res, 200, 'Budget updated successfully', budget);
});

const deleteBudget = asyncHandler(async (req, res) => {
  await deleteBudgetService(req.userId, req.params.id);
  await refreshAlerts(req.userId);
  return sendSuccess(res, 200, 'Budget deleted successfully');
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getBudgetAnalytics(req.userId);
  return sendSuccess(res, 200, 'Budget analytics fetched successfully', analytics);
});

module.exports = {
  createBudget,
  deleteBudget,
  getAnalytics,
  getBudget,
  getBudgets,
  updateBudget
};
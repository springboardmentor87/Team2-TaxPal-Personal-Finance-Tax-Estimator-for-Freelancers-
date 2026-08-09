const { Op } = require('sequelize');
const { Budget, Transaction } = require('../models');
const AppError = require('../utils/AppError');
const { endOfMonth, endOfYear, roundToTwo, startOfMonth, startOfYear, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const normalizePeriod = (period) => {
  const value = String(period || 'monthly').toLowerCase();
  const allowed = ['weekly', 'monthly', 'quarterly', 'yearly'];

  if (!allowed.includes(value)) {
    throw new AppError('Budget period must be weekly, monthly, quarterly, or yearly', 400);
  }

  return value;
};

const getPeriodRange = (period, referenceDate = new Date()) => {
  if (period === 'weekly') {
    const day = referenceDate.getDay();
    const start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (period === 'quarterly') {
    const currentQuarter = Math.floor(referenceDate.getMonth() / 3);
    const start = new Date(referenceDate.getFullYear(), currentQuarter * 3, 1);
    const end = new Date(referenceDate.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'yearly') {
    return {
      start: startOfYear(referenceDate.getFullYear()),
      end: endOfYear(referenceDate.getFullYear())
    };
  }

  return {
    start: startOfMonth(referenceDate),
    end: endOfMonth(referenceDate)
  };
};

const normalizeBudgetInput = (payload) => {
  const category = String(payload.category || '').trim();
  const rawAmount = payload.limit !== undefined ? payload.limit : payload.amount;
  const amount = Number(rawAmount);
  const period = payload.period ? normalizePeriod(payload.period) : 'monthly';

  let name = String(payload.name || '').trim();

  if (!category) {
    throw new AppError('Budget category is required', 400);
  }

  if (!name) {
    name = `${category} Budget`;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Budget limit must be a positive number', 400);
  }

  let month = payload.month ? String(payload.month).trim() : null;
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    throw new AppError('Month must be in YYYY-MM format', 400);
  }

  return {
    name,
    category,
    month,
    amount: roundToTwo(amount),
    period,
    alertThreshold: payload.threshold !== undefined ? Number(payload.threshold) / 100 : 0.8
  };
};

const getBudgetWithUsage = async (userId, budgetObj) => {
  if (!budgetObj) {
    return null;
  }

  const budget = serializeDocument(budgetObj);
  let range;

  if (budget.month && /^\d{4}-\d{2}$/.test(budget.month)) {
    const [year, monthNum] = budget.month.split('-').map(Number);
    const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
    range = { start, end };
  } else {
    range = getPeriodRange(budget.period, new Date());
  }

  const spentTransactions = await Transaction.findAll({
    where: {
      userId,
      type: 'expense',
      category: budget.category,
      date: {
        [Op.gte]: range.start,
        [Op.lte]: range.end
      }
    }
  });

  const transactions = serializeDocuments(spentTransactions);
  const spent = roundToTwo(sum(transactions.map((transaction) => transaction.amount)));
  const remaining = roundToTwo(Number(budget.amount || 0) - spent);
  const utilization = budget.amount ? roundToTwo((spent / Number(budget.amount)) * 100) : 0;
  const thresholdPercent = (budget.alertThreshold || 0.8) * 100;

  return {
    ...budget,
    limit: budget.amount,
    threshold: thresholdPercent,
    usage: {
      spent,
      remaining,
      utilization,
      status: utilization >= 100 ? 'over' : utilization >= thresholdPercent ? 'warning' : 'healthy',
      periodStart: range.start,
      periodEnd: range.end
    }
  };
};

const createBudget = async (userId, payload) => {
  const budgetData = normalizeBudgetInput(payload);
  const budget = await Budget.create({
    userId,
    ...budgetData
  });

  return getBudgetWithUsage(userId, budget);
};

const listBudgets = async (userId) => {
  const budgets = await Budget.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });

  const enriched = await Promise.all(budgets.map(async (budget) => getBudgetWithUsage(userId, budget)));
  return enriched;
};

const getBudgetById = async (userId, budgetId) => {
  const budget = await Budget.findOne({
    where: {
      id: budgetId,
      userId
    }
  });

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  return getBudgetWithUsage(userId, budget);
};

const updateBudget = async (userId, budgetId, payload) => {
  const budget = await Budget.findOne({
    where: {
      id: budgetId,
      userId
    }
  });

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  const update = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    update.name = name || `${budget.category} Budget`;
  }

  if (payload.category !== undefined) {
    const category = String(payload.category).trim();
    if (!category) {
      throw new AppError('Budget category is required', 400);
    }
    update.category = category;
  }

  const rawAmount = payload.limit !== undefined ? payload.limit : payload.amount;
  if (rawAmount !== undefined) {
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('Budget limit must be greater than zero', 400);
    }
    update.amount = roundToTwo(amount);
  }

  if (payload.month !== undefined) {
    const month = String(payload.month).trim();
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      throw new AppError('Month must be in YYYY-MM format', 400);
    }
    update.month = month;
  }

  if (payload.period !== undefined) {
    update.period = normalizePeriod(payload.period);
  }

  if (payload.threshold !== undefined) {
    update.alertThreshold = Number(payload.threshold) / 100;
  }

  await budget.update(update);
  return getBudgetWithUsage(userId, budget);
};

const deleteBudget = async (userId, budgetId) => {
  const budget = await Budget.findOne({
    where: {
      id: budgetId,
      userId
    }
  });

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  const serialized = serializeDocument(budget);
  await budget.destroy();
  return serialized;
};

const getBudgetOverview = async (userId) => {
  const budgets = await listBudgets(userId);

  return {
    totalBudgets: budgets.length,
    activeBudgets: budgets.length,
    totalAllocated: roundToTwo(sum(budgets.map((budget) => budget.amount))),
    totalSpent: roundToTwo(sum(budgets.map((budget) => budget.usage?.spent || 0))),
    totalRemaining: roundToTwo(sum(budgets.map((budget) => budget.usage?.remaining || 0))),
    budgets
  };
};

const getBudgetProgress = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [budgets, rawExpenses] = await Promise.all([
    Budget.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    }),
    Transaction.findAll({
      where: {
        userId,
        type: 'expense',
        date: {
          [Op.gte]: startOfMonth,
          [Op.lt]: startOfNextMonth
        }
      }
    })
  ]);

  const expenses = serializeDocuments(rawExpenses);

  return budgets.map((budgetObj) => {
    const budget = serializeDocument(budgetObj);
    const spent = roundToTwo(sum(
      expenses
        .filter((transaction) => transaction.category === budget.category)
        .map((transaction) => transaction.amount)
    ));
    const budgetAmount = Number(budget.amount || 0);
    const remaining = roundToTwo(budgetAmount - spent);

    return {
      category: budget.category,
      budget: roundToTwo(budgetAmount),
      spent,
      remaining,
      status: spent > budgetAmount ? 'Over Budget' : 'Within Budget'
    };
  });
};

const getBudgetAnalytics = async (userId) => {
  const budgets = await listBudgets(userId);
  const byCategory = budgets.reduce((accumulator, budget) => {
    const existing = accumulator[budget.category] || {
      category: budget.category,
      budgeted: 0,
      spent: 0,
      remaining: 0
    };

    existing.budgeted += Number(budget.amount || 0);
    existing.spent += Number(budget.usage?.spent || 0);
    existing.remaining += Number(budget.usage?.remaining || 0);

    accumulator[budget.category] = existing;
    return accumulator;
  }, {});

  return {
    overview: await getBudgetOverview(userId),
    byCategory: Object.values(byCategory).map((entry) => ({
      ...entry,
      budgeted: roundToTwo(entry.budgeted),
      spent: roundToTwo(entry.spent),
      remaining: roundToTwo(entry.remaining),
      utilization: entry.budgeted ? roundToTwo((entry.spent / entry.budgeted) * 100) : 0
    }))
  };
};

module.exports = {
  createBudget,
  deleteBudget,
  getBudgetAnalytics,
  getBudgetById,
  getBudgetOverview,
  getBudgetProgress,
  getBudgetWithUsage,
  listBudgets,
  updateBudget
};
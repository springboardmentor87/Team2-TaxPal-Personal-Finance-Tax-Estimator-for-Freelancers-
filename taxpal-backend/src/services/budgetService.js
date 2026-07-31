const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { getCollection } = require('./mongoService');
const { endOfMonth, endOfYear, roundToTwo, startOfMonth, startOfYear, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const collectionName = 'budgets';

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
  const name = String(payload.name || '').trim();
  const category = String(payload.category || '').trim();
  const period = normalizePeriod(payload.period);
  const amount = Number(payload.amount);

  if (!name) {
    throw new AppError('Budget name is required', 400);
  }

  if (!category) {
    throw new AppError('Budget category is required', 400);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Budget amount must be greater than zero', 400);
  }

  return {
    name,
    category,
    amount: roundToTwo(amount),
    period,
    active: payload.active !== undefined ? Boolean(payload.active) : true,
    threshold: payload.threshold !== undefined ? Number(payload.threshold) : 80,
    notes: payload.notes ? String(payload.notes).trim() : ''
  };
};

const getBudgetCollection = () => getCollection(collectionName);

const getBudgetWithUsage = async (userId, budget) => {
  if (!budget) {
    return null;
  }

  const range = getPeriodRange(budget.period, new Date());

  const spentTransactions = await Transaction.find({
    user: new mongoose.Types.ObjectId(userId),
    type: 'expense',
    category: budget.category,
    date: {
      $gte: range.start,
      $lte: range.end
    }
  }).lean();

  const spent = roundToTwo(sum(spentTransactions.map((transaction) => transaction.amount)));
  const remaining = roundToTwo(Number(budget.amount || 0) - spent);
  const utilization = budget.amount ? roundToTwo((spent / Number(budget.amount)) * 100) : 0;

  return {
    ...serializeDocument(budget),
    usage: {
      spent,
      remaining,
      utilization,
      status: utilization >= 100 ? 'over' : utilization >= (Number(budget.threshold) || 80) ? 'warning' : 'healthy',
      periodStart: range.start,
      periodEnd: range.end
    }
  };
};

const createBudget = async (userId, payload) => {
  const budget = normalizeBudgetInput(payload);
  const collection = getBudgetCollection();
  const now = new Date();

  const document = {
    userId,
    ...budget,
    createdAt: now,
    updatedAt: now
  };

  const result = await collection.insertOne(document);
  return serializeDocument({ ...document, _id: result.insertedId });
};

const listBudgets = async (userId) => {
  const collection = getBudgetCollection();
  const budgets = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  const enriched = await Promise.all(budgets.map(async (budget) => getBudgetWithUsage(userId, budget)));

  return serializeDocuments(enriched);
};

const getBudgetById = async (userId, budgetId) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new AppError('Invalid budget ID', 400);
  }

  const collection = getBudgetCollection();
  const budget = await collection.findOne({ _id: new mongoose.Types.ObjectId(budgetId), userId });

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  return getBudgetWithUsage(userId, budget);
};

const updateBudget = async (userId, budgetId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new AppError('Invalid budget ID', 400);
  }

  const collection = getBudgetCollection();
  const existingBudget = await collection.findOne({ _id: new mongoose.Types.ObjectId(budgetId), userId });

  if (!existingBudget) {
    throw new AppError('Budget not found', 404);
  }

  const update = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) {
      throw new AppError('Budget name is required', 400);
    }
    update.name = name;
  }

  if (payload.category !== undefined) {
    const category = String(payload.category).trim();
    if (!category) {
      throw new AppError('Budget category is required', 400);
    }
    update.category = category;
  }

  if (payload.amount !== undefined) {
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('Budget amount must be greater than zero', 400);
    }
    update.amount = roundToTwo(amount);
  }

  if (payload.period !== undefined) {
    update.period = normalizePeriod(payload.period);
  }

  if (payload.active !== undefined) {
    update.active = Boolean(payload.active);
  }

  if (payload.threshold !== undefined) {
    update.threshold = Number(payload.threshold);
  }

  if (payload.notes !== undefined) {
    update.notes = String(payload.notes).trim();
  }

  const result = await collection.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(budgetId), userId },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  return getBudgetWithUsage(userId, result.value);
};

const deleteBudget = async (userId, budgetId) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new AppError('Invalid budget ID', 400);
  }

  const collection = getBudgetCollection();
  const result = await collection.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(budgetId),
    userId
  });

  if (!result.value) {
    throw new AppError('Budget not found', 404);
  }

  return serializeDocument(result.value);
};

const getBudgetOverview = async (userId) => {
  const budgets = await listBudgets(userId);
  const activeBudgets = budgets.filter((budget) => budget.active);

  return {
    totalBudgets: budgets.length,
    activeBudgets: activeBudgets.length,
    totalAllocated: roundToTwo(sum(activeBudgets.map((budget) => budget.amount))),
    totalSpent: roundToTwo(sum(activeBudgets.map((budget) => budget.usage?.spent || 0))),
    totalRemaining: roundToTwo(sum(activeBudgets.map((budget) => budget.usage?.remaining || 0))),
    budgets
  };
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
  getBudgetWithUsage,
  listBudgets,
  updateBudget
};
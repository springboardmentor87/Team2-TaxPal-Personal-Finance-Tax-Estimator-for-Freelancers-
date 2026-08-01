const { Op } = require('sequelize');
const { Transaction } = require('../models');
const AppError = require('../utils/AppError');
const { buildDateRange, buildMonthWindow, monthKey, percent, roundToTwo, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

const buildTransactionFilter = (userId, query = {}) => {
  const where = {
    userId
  };

  if (query.type) {
    where.type = query.type;
  }

  if (query.category) {
    where.category = query.category.trim();
  }

  const dateRange = buildDateRange(query.from, query.to);
  if (dateRange) {
    where.date = {};
    if (dateRange.$gte) where.date[Op.gte] = dateRange.$gte;
    if (dateRange.$lte) where.date[Op.lte] = dateRange.$lte;
  }

  if (query.search) {
    const searchTerm = `%${query.search.trim()}%`;
    where[Op.or] = [
      { description: { [Op.like]: searchTerm } },
      { category: { [Op.like]: searchTerm } }
    ];
  }

  return where;
};

const normalizeTransactionInput = (payload) => {
  const type = String(payload.type || '').trim();
  const category = String(payload.category || '').trim();
  const description = String(payload.description || '').trim();
  const amount = Number(payload.amount);

  if (!['income', 'expense'].includes(type)) {
    throw new AppError('Transaction type must be income or expense', 400);
  }

  if (!category) {
    throw new AppError('Category is required', 400);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Amount must be greater than zero', 400);
  }

  const date = payload.date ? new Date(payload.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Transaction date is invalid', 400);
  }

  return {
    type,
    amount: roundToTwo(amount),
    category,
    description,
    date
  };
};

const createTransaction = async (userId, payload) => {
  const transactionData = normalizeTransactionInput(payload);

  const transaction = await Transaction.create({
    userId,
    ...transactionData
  });

  return serializeDocument(transaction);
};

const listTransactions = async (userId, query = {}) => {
  const pagination = parsePagination(query);
  const where = buildTransactionFilter(userId, query);

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    offset: pagination.skip,
    limit: pagination.limit
  });

  return {
    transactions: serializeDocuments(rows),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount: count,
      totalPages: Math.max(1, Math.ceil(count / pagination.limit))
    }
  };
};

const getTransactionById = async (userId, transactionId) => {
  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      userId
    }
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return serializeDocument(transaction);
};

const updateTransaction = async (userId, transactionId, payload) => {
  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      userId
    }
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  const update = {};

  if (payload.type !== undefined) {
    const type = String(payload.type).trim();
    if (!['income', 'expense'].includes(type)) {
      throw new AppError('Transaction type must be income or expense', 400);
    }
    update.type = type;
  }

  if (payload.amount !== undefined) {
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('Amount must be greater than zero', 400);
    }
    update.amount = roundToTwo(amount);
  }

  if (payload.category !== undefined) {
    const category = String(payload.category).trim();
    if (!category) {
      throw new AppError('Category is required', 400);
    }
    update.category = category;
  }

  if (payload.description !== undefined) {
    update.description = String(payload.description).trim();
  }

  if (payload.date !== undefined) {
    const date = new Date(payload.date);
    if (Number.isNaN(date.getTime())) {
      throw new AppError('Transaction date is invalid', 400);
    }
    update.date = date;
  }

  await transaction.update(update);
  return serializeDocument(transaction);
};

const deleteTransaction = async (userId, transactionId) => {
  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      userId
    }
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  const serialized = serializeDocument(transaction);
  await transaction.destroy();
  return serialized;
};

const getTransactionAnalytics = async (userId, query = {}) => {
  const where = buildTransactionFilter(userId, query);
  const rawTransactions = await Transaction.findAll({
    where,
    order: [['date', 'DESC']]
  });
  const transactions = serializeDocuments(rawTransactions);

  const incomeTransactions = transactions.filter((transaction) => transaction.type === 'income');
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense');

  const totalIncome = roundToTwo(sum(incomeTransactions.map((transaction) => transaction.amount)));
  const totalExpenses = roundToTwo(sum(expenseTransactions.map((transaction) => transaction.amount)));
  const netCashFlow = roundToTwo(totalIncome - totalExpenses);
  const savingsRate = percent(netCashFlow > 0 ? netCashFlow : 0, totalIncome);

  const categoryBreakdown = transactions.reduce((accumulator, transaction) => {
    const entry = accumulator[transaction.category] || {
      category: transaction.category,
      income: 0,
      expense: 0,
      net: 0
    };

    if (transaction.type === 'income') {
      entry.income += Number(transaction.amount || 0);
    } else {
      entry.expense += Number(transaction.amount || 0);
    }

    entry.net = roundToTwo(entry.income - entry.expense);
    accumulator[transaction.category] = entry;
    return accumulator;
  }, {});

  const monthlyWindow = buildMonthWindow(6);
  const monthlyTrend = monthlyWindow.map((window) => {
    const monthTransactions = transactions.filter((transaction) => monthKey(new Date(transaction.date)) === window.key);
    const monthIncome = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
    const monthExpense = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));

    return {
      month: window.label,
      income: monthIncome,
      expense: monthExpense,
      net: roundToTwo(monthIncome - monthExpense)
    };
  });

  return {
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      netCashFlow,
      savingsRate
    },
    categoryBreakdown: Object.values(categoryBreakdown)
      .sort((left, right) => right.expense - left.expense)
      .map((entry) => ({
        ...entry,
        expense: roundToTwo(entry.expense),
        income: roundToTwo(entry.income),
        net: roundToTwo(entry.net)
      })),
    monthlyTrend,
    transactionCount: transactions.length
  };
};

module.exports = {
  buildTransactionFilter,
  createTransaction,
  deleteTransaction,
  getTransactionAnalytics,
  getTransactionById,
  listTransactions,
  normalizeTransactionInput,
  parsePagination,
  updateTransaction
};
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { buildDateRange, buildMonthWindow, monthKey, percent, roundToTwo, sum } = require('../utils/finance');

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
  const filter = {
    user: new mongoose.Types.ObjectId(userId)
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.category) {
    filter.category = query.category.trim();
  }

  const dateRange = buildDateRange(query.from, query.to);
  if (dateRange) {
    filter.date = dateRange;
  }

  if (query.search) {
    filter.$or = [
      { description: { $regex: query.search.trim(), $options: 'i' } },
      { category: { $regex: query.search.trim(), $options: 'i' } }
    ];
  }

  return filter;
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
    user: new mongoose.Types.ObjectId(userId),
    ...transactionData
  });

  return transaction.toObject();
};

const listTransactions = async (userId, query = {}) => {
  const pagination = parsePagination(query);
  const filter = buildTransactionFilter(userId, query);

  const [transactions, totalCount] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Transaction.countDocuments(filter)
  ]);

  return {
    transactions,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pagination.limit))
    }
  };
};

const getTransactionById = async (userId, transactionId) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError('Invalid transaction ID', 400);
  }

  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: new mongoose.Types.ObjectId(userId)
  }).lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

const updateTransaction = async (userId, transactionId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError('Invalid transaction ID', 400);
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

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      user: new mongoose.Types.ObjectId(userId)
    },
    {
      $set: update
    },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

const deleteTransaction = async (userId, transactionId) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError('Invalid transaction ID', 400);
  }

  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    user: new mongoose.Types.ObjectId(userId)
  }).lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

const getTransactionAnalytics = async (userId, query = {}) => {
  const filter = buildTransactionFilter(userId, query);
  const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

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
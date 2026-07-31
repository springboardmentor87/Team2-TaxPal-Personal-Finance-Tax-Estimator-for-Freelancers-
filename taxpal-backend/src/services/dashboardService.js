const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { getCollection } = require('./mongoService');
const { buildMonthWindow, monthKey, percent, roundToTwo, sum } = require('../utils/finance');
const { getBudgetOverview } = require('./budgetService');
const { getTaxEstimate } = require('./taxService');

const getDashboardSummary = async (userId) => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [currentMonthTransactions, recentTransactions, yearToDateTransactions, user] = await Promise.all([
    Transaction.find({
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: startOfCurrentMonth, $lte: now }
    }).sort({ date: -1 }).lean(),
    Transaction.find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean(),
    Transaction.find({
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: startOfYear, $lte: now }
    }).lean(),
    User.findById(userId).select('name email country').lean()
  ]);

  const monthlyIncome = roundToTwo(sum(currentMonthTransactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
  const monthlyExpenses = roundToTwo(sum(currentMonthTransactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));
  const netCashFlow = roundToTwo(monthlyIncome - monthlyExpenses);
  const savingsRate = percent(netCashFlow > 0 ? netCashFlow : 0, monthlyIncome);

  const monthLabels = buildMonthWindow(6);
  const monthlyTrend = monthLabels.map((window) => {
    const monthTransactions = yearToDateTransactions.filter((transaction) => monthKey(new Date(transaction.date)) === window.key);
    const income = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
    const expense = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));

    return {
      month: window.label,
      income,
      expense,
      net: roundToTwo(income - expense)
    };
  });

  const topCategories = yearToDateTransactions.reduce((accumulator, transaction) => {
    const entry = accumulator[transaction.category] || {
      category: transaction.category,
      income: 0,
      expense: 0
    };

    if (transaction.type === 'income') {
      entry.income += Number(transaction.amount || 0);
    } else {
      entry.expense += Number(transaction.amount || 0);
    }

    accumulator[transaction.category] = entry;
    return accumulator;
  }, {});

  const alertsCollection = getCollection('alerts');
  const [budgetOverview, taxEstimate, alertCount, unreadAlerts] = await Promise.all([
    getBudgetOverview(userId),
    getTaxEstimate(userId, { year: now.getFullYear() }, { skipPersistence: true }),
    alertsCollection.countDocuments({ userId, resolved: false }),
    alertsCollection.countDocuments({ userId, read: false })
  ]);

  return {
    user,
    summary: {
      monthlyIncome,
      monthlyExpenses,
      netCashFlow,
      savingsRate,
      recentTransactionsCount: recentTransactions.length,
      activeBudgets: budgetOverview.activeBudgets,
      unreadAlerts,
      openAlerts: alertCount,
      estimatedAnnualTax: taxEstimate.tax.estimatedTax
    },
    monthlyTrend,
    topCategories: Object.values(topCategories)
      .sort((left, right) => right.expense - left.expense)
      .slice(0, 5)
      .map((entry) => ({
        ...entry,
        income: roundToTwo(entry.income),
        expense: roundToTwo(entry.expense)
      })),
    recentTransactions,
    budgetOverview,
    taxEstimate,
    alerts: {
      open: alertCount,
      unread: unreadAlerts
    }
  };
};

const getDashboardAnalytics = async (userId) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const transactions = await Transaction.find({
    user: new mongoose.Types.ObjectId(userId),
    date: { $gte: startOfYear, $lte: now }
  }).lean();

  const monthlyGroups = buildMonthWindow(12);
  const monthlyAnalytics = monthlyGroups.map((window) => {
    const monthTransactions = transactions.filter((transaction) => monthKey(new Date(transaction.date)) === window.key);
    const income = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
    const expenses = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));
    const net = roundToTwo(income - expenses);

    return {
      month: window.label,
      income,
      expenses,
      net,
      savingsRate: percent(net > 0 ? net : 0, income)
    };
  });

  const categoryTotals = transactions.reduce((accumulator, transaction) => {
    const entry = accumulator[transaction.category] || {
      category: transaction.category,
      income: 0,
      expenses: 0
    };

    if (transaction.type === 'income') {
      entry.income += Number(transaction.amount || 0);
    } else {
      entry.expenses += Number(transaction.amount || 0);
    }

    accumulator[transaction.category] = entry;
    return accumulator;
  }, {});

  return {
    monthlyAnalytics,
    categoryBreakdown: Object.values(categoryTotals)
      .sort((left, right) => right.expenses - left.expenses)
      .map((entry) => ({
        ...entry,
        income: roundToTwo(entry.income),
        expenses: roundToTwo(entry.expenses)
      })),
    transactionCount: transactions.length
  };
};

module.exports = {
  getDashboardAnalytics,
  getDashboardSummary
};
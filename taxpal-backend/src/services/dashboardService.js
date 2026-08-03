const { Op } = require('sequelize');
const { Transaction, User, Alert } = require('../models');
const { buildMonthWindow, monthKey, percent, roundToTwo, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');
const { getBudgetOverview } = require('./budgetService');
const { getTaxEstimate } = require('./taxService');

const getDashboardSummary = async (userId) => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [rawCurrentMonth, rawRecent, rawYtd, userObj] = await Promise.all([
    Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: startOfCurrentMonth, [Op.lte]: now }
      },
      order: [['date', 'DESC']]
    }),
    Transaction.findAll({
      where: { userId },
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 5
    }),
    Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: startOfYear, [Op.lte]: now }
      }
    }),
    User.findByPk(userId, { attributes: ['id', 'name', 'email', 'country'] })
  ]);

  const currentMonthTransactions = serializeDocuments(rawCurrentMonth);
  const recentTransactions = serializeDocuments(rawRecent);
  const yearToDateTransactions = serializeDocuments(rawYtd);
  const user = serializeDocument(userObj);

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

  const [budgetOverview, taxEstimate, alertCount, unreadAlerts] = await Promise.all([
    getBudgetOverview(userId),
    getTaxEstimate(userId, { year: now.getFullYear() }, { skipPersistence: true }),
    Alert.count({ where: { userId, resolved: false } }),
    Alert.count({ where: { userId, read: false } })
  ]);

  const rawAllTransactions = await Transaction.findAll({ where: { userId } });
  const allTransactions = serializeDocuments(rawAllTransactions);

  const totalIncome = roundToTwo(sum(allTransactions.filter((t) => t.type === 'income').map((t) => t.amount)));
  const totalExpenses = roundToTwo(sum(allTransactions.filter((t) => t.type === 'expense').map((t) => t.amount)));
  const currentBalance = roundToTwo(totalIncome - totalExpenses);

  return {
    user,
    totalIncome,
    totalExpenses,
    currentBalance,
    latest5Transactions: recentTransactions,
    summary: {
      totalIncome,
      totalExpenses,
      currentBalance,
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

  const rawTransactions = await Transaction.findAll({
    where: {
      userId,
      date: { [Op.gte]: startOfYear, [Op.lte]: now }
    }
  });
  const transactions = serializeDocuments(rawTransactions);

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
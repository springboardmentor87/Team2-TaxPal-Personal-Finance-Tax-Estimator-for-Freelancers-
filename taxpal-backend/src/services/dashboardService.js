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

  const rawAllTransactions = await Transaction.findAll({ where: { userId } });
  const allTransactions = serializeDocuments(rawAllTransactions);

  const totalIncome = roundToTwo(sum(allTransactions.filter((t) => t.type === 'income').map((t) => t.amount)));
  const totalExpenses = roundToTwo(sum(allTransactions.filter((t) => t.type === 'expense').map((t) => t.amount)));
  const currentBalance = roundToTwo(totalIncome - totalExpenses);

  const monthlyIncome = roundToTwo(sum(currentMonthTransactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
  const monthlyExpenses = roundToTwo(sum(currentMonthTransactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));
  const netCashFlow = roundToTwo(monthlyIncome - monthlyExpenses);
  const savingsRate = percent(netCashFlow > 0 ? netCashFlow : 0, monthlyIncome);

  // 1. Monthly trend (6-month window)
  const monthLabels = buildMonthWindow(6);
  const monthlyTrend = monthLabels.map((window) => {
    const monthTransactions = allTransactions.filter((transaction) => monthKey(new Date(transaction.date)) === window.key);
    const income = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
    const expense = roundToTwo(sum(monthTransactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));

    return {
      month: window.label,
      income,
      expense,
      net: roundToTwo(income - expense)
    };
  });

  // 2. Quarterly trend (Q1 - Q4 of current year)
  const currentYear = now.getFullYear();
  const quarterlyTrend = [1, 2, 3, 4].map((q) => {
    const startMonth = (q - 1) * 3;
    const endMonth = startMonth + 2;
    const qTransactions = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() >= startMonth && d.getMonth() <= endMonth;
    });
    const income = roundToTwo(sum(qTransactions.filter((t) => t.type === 'income').map((t) => t.amount)));
    const expense = roundToTwo(sum(qTransactions.filter((t) => t.type === 'expense').map((t) => t.amount)));

    return {
      quarter: `Q${q}`,
      income,
      expense,
      net: roundToTwo(income - expense)
    };
  });

  // 3. Yearly trend (4 years)
  const yearlyTrend = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map((yr) => {
    const yrTransactions = allTransactions.filter((t) => new Date(t.date).getFullYear() === yr);
    const income = roundToTwo(sum(yrTransactions.filter((t) => t.type === 'income').map((t) => t.amount)));
    const expense = roundToTwo(sum(yrTransactions.filter((t) => t.type === 'expense').map((t) => t.amount)));

    return {
      year: String(yr),
      income,
      expense,
      net: roundToTwo(income - expense)
    };
  });

  // 4. Top categories (from expense transactions)
  const categoryMap = allTransactions.reduce((accumulator, transaction) => {
    if (transaction.type !== 'expense') return accumulator;
    const cat = transaction.category || 'Other';
    const entry = accumulator[cat] || { category: cat, income: 0, expense: 0 };
    entry.expense += Number(transaction.amount || 0);
    accumulator[cat] = entry;
    return accumulator;
  }, {});

  const topCategories = Object.values(categoryMap)
    .sort((left, right) => right.expense - left.expense)
    .slice(0, 5)
    .map((entry) => ({
      ...entry,
      income: 0,
      expense: roundToTwo(entry.expense)
    }));

  const [budgetOverview, taxEstimate, alertCount, unreadAlerts] = await Promise.all([
    getBudgetOverview(userId),
    getTaxEstimate(userId, { year: now.getFullYear() }, { skipPersistence: true }),
    Alert.count({ where: { userId, resolved: false } }),
    Alert.count({ where: { userId, read: false } })
  ]);

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
    quarterlyTrend,
    yearlyTrend,
    topCategories,
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

const getSpendingBreakdown = async (userId) => {
  const rawExpenses = await Transaction.findAll({
    where: {
      userId,
      type: 'expense'
    }
  });

  const expenses = serializeDocuments(rawExpenses);

  const categoryTotals = expenses.reduce((accumulator, transaction) => {
    const category = transaction.category || 'Uncategorized';
    accumulator[category] = (accumulator[category] || 0) + Number(transaction.amount || 0);
    return accumulator;
  }, {});

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: roundToTwo(amount)
    }))
    .sort((left, right) => right.amount - left.amount);
};

module.exports = {
  getDashboardAnalytics,
  getDashboardSummary,
  getSpendingBreakdown
};
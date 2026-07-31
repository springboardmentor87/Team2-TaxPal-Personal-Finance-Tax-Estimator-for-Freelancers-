const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { roundToTwo, sum } = require('../utils/finance');

const taxRules = {
  india: {
    standardDeduction: 50000,
    deductibleExpenseCap: 0.7,
    brackets: [
      { upTo: 300000, rate: 0 },
      { upTo: 600000, rate: 0.05 },
      { upTo: 900000, rate: 0.1 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 }
    ]
  },
  usa: {
    standardDeduction: 14600,
    deductibleExpenseCap: 0.8,
    brackets: [
      { upTo: 11600, rate: 0.1 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 }
    ]
  },
  canada: {
    standardDeduction: 15000,
    deductibleExpenseCap: 0.75,
    brackets: [
      { upTo: 55867, rate: 0.15 },
      { upTo: 111733, rate: 0.205 },
      { upTo: 173205, rate: 0.26 },
      { upTo: 246752, rate: 0.29 },
      { upTo: Infinity, rate: 0.33 }
    ]
  },
  uk: {
    standardDeduction: 12570,
    deductibleExpenseCap: 0.75,
    brackets: [
      { upTo: 50270, rate: 0.2 },
      { upTo: 125140, rate: 0.4 },
      { upTo: Infinity, rate: 0.45 }
    ]
  },
  default: {
    standardDeduction: 0,
    deductibleExpenseCap: 0.7,
    brackets: [
      { upTo: 50000, rate: 0.15 },
      { upTo: 100000, rate: 0.2 },
      { upTo: Infinity, rate: 0.25 }
    ]
  }
};

const computeTax = (taxableIncome, brackets) => {
  let remainingIncome = Math.max(0, taxableIncome);
  let lowerBound = 0;
  let totalTax = 0;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) {
      break;
    }

    const upperBound = bracket.upTo;
    const taxablePortion = Math.min(remainingIncome, upperBound - lowerBound);
    totalTax += taxablePortion * bracket.rate;
    remainingIncome -= taxablePortion;
    lowerBound = upperBound;
  }

  return roundToTwo(totalTax);
};

const getTaxEstimate = async (userId, query = {}, options = {}) => {
  const year = Number.parseInt(query.year, 10) || new Date().getFullYear();
  const user = await User.findById(userId).select('country name email').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const rules = taxRules[String(query.country || user.country || 'default').toLowerCase()] || taxRules.default;
  const now = new Date();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const transactions = await Transaction.find({
    user: new mongoose.Types.ObjectId(userId),
    date: { $gte: startOfYear, $lte: now < endOfYear ? now : endOfYear }
  }).lean();

  const incomeTransactions = transactions.filter((transaction) => transaction.type === 'income');
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense');

  const monthsElapsed = Math.max(1, now.getMonth() + 1);
  const ytdIncome = roundToTwo(sum(incomeTransactions.map((transaction) => transaction.amount)));
  const ytdExpenses = roundToTwo(sum(expenseTransactions.map((transaction) => transaction.amount)));

  const annualizedIncome = roundToTwo(ytdIncome * (12 / monthsElapsed));
  const annualizedExpenses = roundToTwo(ytdExpenses * (12 / monthsElapsed));
  const deductibleExpenses = roundToTwo(Math.min(annualizedExpenses, annualizedIncome * rules.deductibleExpenseCap));
  const taxableIncome = Math.max(0, annualizedIncome - deductibleExpenses - rules.standardDeduction);
  const estimatedTax = computeTax(taxableIncome, rules.brackets);
  const effectiveTaxRate = taxableIncome > 0 ? roundToTwo((estimatedTax / taxableIncome) * 100) : 0;

  const result = {
    year,
    jurisdiction: String(query.country || user.country || 'default').toLowerCase(),
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      country: user.country
    },
    income: {
      yearToDate: ytdIncome,
      annualized: annualizedIncome
    },
    expenses: {
      yearToDate: ytdExpenses,
      annualized: annualizedExpenses,
      deductible: deductibleExpenses
    },
    tax: {
      standardDeduction: rules.standardDeduction,
      taxableIncome,
      estimatedTax,
      monthlyEstimate: roundToTwo(estimatedTax / 12),
      effectiveTaxRate
    },
    assumptions: {
      monthsElapsed,
      expenseCap: rules.deductibleExpenseCap
    }
  };

  if (!options.skipPersistence) {
    result.generatedAt = now.toISOString();
  }

  return result;
};

module.exports = {
  computeTax,
  getTaxEstimate
};
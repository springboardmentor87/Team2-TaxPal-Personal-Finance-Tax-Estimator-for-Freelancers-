const { Op } = require('sequelize');
const { Transaction, User } = require('../models');
const AppError = require('../utils/AppError');
const { roundToTwo, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

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
  const userObj = await User.findByPk(userId);

  if (!userObj) {
    throw new AppError('User not found', 404);
  }

  const user = serializeDocument(userObj);
  const rules = taxRules[String(query.country || user.country || 'default').toLowerCase()] || taxRules.default;
  const now = new Date();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const rawTransactions = await Transaction.findAll({
    where: {
      userId,
      date: { [Op.gte]: startOfYear, [Op.lte]: now < endOfYear ? now : endOfYear }
    }
  });

  const transactions = serializeDocuments(rawTransactions);
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

const calculateQuarterlyTax = async (userId, payload) => {
  const userObj = await User.findByPk(userId);
  const countryKey = String(payload.country || userObj?.country || 'usa').toLowerCase();
  const rules = taxRules[countryKey] || taxRules.default;

  const grossIncome = Number(payload.grossIncome || 0);
  const businessExpenses = Number(payload.businessExpenses || 0);
  const retirementContributions = Number(payload.retirementContributions || 0);
  const healthInsurance = Number(payload.healthInsurance || payload.healthInsurancePremiums || 0);
  const homeOfficeDeduction = Number(payload.homeOfficeDeduction || 0);

  const totalDeductions = roundToTwo(businessExpenses + retirementContributions + healthInsurance + homeOfficeDeduction);
  const quarterlyStandardDeduction = roundToTwo(rules.standardDeduction / 4);
  const taxableIncome = Math.max(0, grossIncome - totalDeductions - quarterlyStandardDeduction);

  const quarterlyBrackets = rules.brackets.map((b) => ({
    upTo: b.upTo === Infinity ? Infinity : b.upTo / 4,
    rate: b.rate
  }));

  const estimatedQuarterlyTax = computeTax(taxableIncome, quarterlyBrackets);
  const effectiveTaxRate = taxableIncome > 0 ? roundToTwo((estimatedQuarterlyTax / taxableIncome) * 100) : 0;
  const monthlySetAside = roundToTwo(estimatedQuarterlyTax / 3);

  return {
    country: payload.country || userObj?.country || 'USA',
    state: payload.state || 'California',
    filingStatus: payload.filingStatus || 'Single',
    quarter: payload.quarter || 'Q3 (Jul-Sep)',
    grossIncome: roundToTwo(grossIncome),
    deductions: {
      businessExpenses: roundToTwo(businessExpenses),
      retirementContributions: roundToTwo(retirementContributions),
      healthInsurance: roundToTwo(healthInsurance),
      homeOfficeDeduction: roundToTwo(homeOfficeDeduction),
      totalDeductions
    },
    taxSummary: {
      standardDeduction: quarterlyStandardDeduction,
      taxableIncome: roundToTwo(taxableIncome),
      estimatedQuarterlyTax: roundToTwo(estimatedQuarterlyTax),
      effectiveTaxRate,
      monthlySetAside
    }
  };
};

const getTaxCalendar = async (userId, yearInput) => {
  const year = Number(yearInput) || new Date().getFullYear();
  return [
    {
      month: `April ${year}`,
      title: 'Reminder: Q1 Estimated Tax Payment',
      date: `Apr 1, ${year}`,
      dueDate: `Apr 15, ${year}`,
      description: 'First quarter estimated tax payment due.',
      type: 'reminder',
      status: 'upcoming'
    },
    {
      month: `June ${year}`,
      title: 'Reminder: Q2 Estimated Tax Payment',
      date: `Jun 1, ${year}`,
      dueDate: `Jun 15, ${year}`,
      description: 'Second quarter estimated tax payment due.',
      type: 'reminder',
      status: 'upcoming'
    },
    {
      month: `September ${year}`,
      title: 'Reminder: Q3 Estimated Tax Payment',
      date: `Sep 1, ${year}`,
      dueDate: `Sep 15, ${year}`,
      description: 'Third quarter estimated tax payment due.',
      type: 'reminder',
      status: 'upcoming'
    },
    {
      month: `January ${year + 1}`,
      title: 'Reminder: Q4 Estimated Tax Payment',
      date: `Jan 1, ${year + 1}`,
      dueDate: `Jan 15, ${year + 1}`,
      description: 'Fourth quarter estimated tax payment due.',
      type: 'reminder',
      status: 'upcoming'
    }
  ];
};

module.exports = {
  calculateQuarterlyTax,
  computeTax,
  getTaxCalendar,
  getTaxEstimate
};
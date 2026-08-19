const { Op } = require('sequelize');
const { Transaction, User, TaxEvent } = require('../models');
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

const getDefaultDeadlinesForCountry = (country, year) => {
  const c = String(country || 'default').toLowerCase();
  switch (c) {
    case 'india':
      return [
        { title: '4th Installment of Advance Tax', description: 'Pay 100% of advance tax for the current financial year.', dueDate: `${year}-03-15`, isCustom: false },
        { title: 'Tax Saving Investments Deadline', description: 'Last date to make tax-saving investments under Section 80C, 80D, etc. to reduce tax liability.', dueDate: `${year}-03-31`, isCustom: false },
        { title: '1st Installment of Advance Tax', description: 'Pay 15% of advance tax for the current financial year.', dueDate: `${year}-06-15`, isCustom: false },
        { title: 'Income Tax Return (ITR) Filing', description: 'File your annual income tax return for the previous financial year.', dueDate: `${year}-07-31`, isCustom: false },
        { title: '2nd Installment of Advance Tax', description: 'Pay 45% of advance tax for the current financial year.', dueDate: `${year}-09-15`, isCustom: false },
        { title: '3rd Installment of Advance Tax', description: 'Pay 75% of advance tax for the current financial year.', dueDate: `${year}-12-15`, isCustom: false }
      ];
    case 'usa':
    case 'united states':
      return [
        { title: 'Q4 Estimated Tax Payment', description: 'Due date for Q4 estimated tax payment for the previous year (Form 1040-ES).', dueDate: `${year}-01-15`, isCustom: false },
        { title: '1099-NEC Mailing Deadline', description: 'Deadline for businesses to mail Form 1099-NEC to independent contractors.', dueDate: `${year}-01-31`, isCustom: false },
        { title: 'Annual Tax Return Filing', description: 'File Federal Income Tax Return (Form 1040) and pay any outstanding tax due.', dueDate: `${year}-04-15`, isCustom: false },
        { title: 'Q1 Estimated Tax Payment', description: 'Due date for Q1 estimated tax payments (Form 1040-ES).', dueDate: `${year}-04-15`, isCustom: false },
        { title: 'Q2 Estimated Tax Payment', description: 'Due date for Q2 estimated tax payments (Form 1040-ES).', dueDate: `${year}-06-15`, isCustom: false },
        { title: 'Q3 Estimated Tax Payment', description: 'Due date for Q3 estimated tax payments (Form 1040-ES).', dueDate: `${year}-09-15`, isCustom: false },
        { title: 'Extension Filing Deadline', description: 'Filing deadline if you requested a 6-month extension (Form 4868).', dueDate: `${year}-10-15`, isCustom: false }
      ];
    case 'canada':
      return [
        { title: 'Q1 Personal Tax Installment', description: 'First quarterly tax installment due for individuals.', dueDate: `${year}-03-15`, isCustom: false },
        { title: 'Personal Tax Return Filing', description: 'File personal income tax return and pay outstanding tax balance.', dueDate: `${year}-04-30`, isCustom: false },
        { title: 'Q2 Personal Tax Installment', description: 'Second quarterly tax installment due for individuals.', dueDate: `${year}-06-15`, isCustom: false },
        { title: 'Self-Employed Tax Return Filing', description: 'Filing deadline for self-employed individuals (payment is still due April 30).', dueDate: `${year}-06-15`, isCustom: false },
        { title: 'Q3 Personal Tax Installment', description: 'Third quarterly tax installment due for individuals.', dueDate: `${year}-09-15`, isCustom: false },
        { title: 'Q4 Personal Tax Installment', description: 'Fourth quarterly tax installment due for individuals.', dueDate: `${year}-12-15`, isCustom: false }
      ];
    case 'uk':
    case 'united kingdom':
      return [
        { title: 'Online Self-Assessment Return & Payment', description: 'Deadline to file your online tax return and pay your tax bill for the previous tax year.', dueDate: `${year}-01-31`, isCustom: false },
        { title: 'First Payment on Account', description: 'First advance payment towards your next tax bill.', dueDate: `${year}-01-31`, isCustom: false },
        { title: 'End of Tax Year', description: 'End of the current UK tax year.', dueDate: `${year}-04-05`, isCustom: false },
        { title: 'Second Payment on Account', description: 'Second advance payment towards your next tax bill.', dueDate: `${year}-07-31`, isCustom: false },
        { title: 'Paper Self-Assessment Return', description: 'Deadline to file paper tax return (if not online).', dueDate: `${year}-10-31`, isCustom: false }
      ];
    default:
      return [
        { title: 'Annual Tax Return Filing', description: 'File annual income tax return and pay any tax due.', dueDate: `${year}-04-15`, isCustom: false },
        { title: 'Mid-Year Tax Checkpoint', description: 'Review your earnings and estimate mid-year tax liability.', dueDate: `${year}-06-15`, isCustom: false },
        { title: 'Year-End Tax Planning', description: 'Optimize tax deductions and compile receipts before the year ends.', dueDate: `${year}-12-31`, isCustom: false }
      ];
  }
};

const getOrCreateTaxEvents = async (userId, queryCountry, yearInput) => {
  const year = Number.parseInt(yearInput, 10) || new Date().getFullYear();
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const country = queryCountry || user.country || 'default';

  // Find events for this user within this year
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  let events = await TaxEvent.findAll({
    where: {
      userId,
      dueDate: {
        [Op.between]: [startOfYear, endOfYear]
      }
    },
    order: [['dueDate', 'ASC'], ['id', 'ASC']]
  });

  // If 0 events exist, seed standard deadlines for this country/year
  if (events.length === 0) {
    const defaults = getDefaultDeadlinesForCountry(country, year);
    const toInsert = defaults.map(d => ({
      ...d,
      userId,
      completed: false
    }));
    await TaxEvent.bulkCreate(toInsert);

    // Fetch them back sorted
    events = await TaxEvent.findAll({
      where: {
        userId,
        dueDate: {
          [Op.between]: [startOfYear, endOfYear]
        }
      },
      order: [['dueDate', 'ASC'], ['id', 'ASC']]
    });
  }

  return serializeDocuments(events);
};

const createTaxEvent = async (userId, data) => {
  if (!data.title || !data.dueDate) {
    throw new AppError('Title and due date are required', 400);
  }

  const newEvent = await TaxEvent.create({
    userId,
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate,
    completed: !!data.completed,
    isCustom: true
  });

  return serializeDocument(newEvent);
};

const updateTaxEvent = async (userId, id, data) => {
  const event = await TaxEvent.findOne({
    where: { id, userId }
  });

  if (!event) {
    throw new AppError('Tax event not found', 404);
  }

  const updatedFields = {};
  if (data.title !== undefined) updatedFields.title = data.title;
  if (data.description !== undefined) updatedFields.description = data.description;
  if (data.dueDate !== undefined) updatedFields.dueDate = data.dueDate;
  if (data.completed !== undefined) updatedFields.completed = !!data.completed;

  await event.update(updatedFields);
  return serializeDocument(event);
};

const deleteTaxEvent = async (userId, id) => {
  const event = await TaxEvent.findOne({
    where: { id, userId }
  });

  if (!event) {
    throw new AppError('Tax event not found', 404);
  }

  await event.destroy();
  return { success: true, message: 'Tax event deleted successfully' };
};

module.exports = {
  computeTax,
  getTaxEstimate,
  getOrCreateTaxEvents,
  createTaxEvent,
  updateTaxEvent,
  deleteTaxEvent
};
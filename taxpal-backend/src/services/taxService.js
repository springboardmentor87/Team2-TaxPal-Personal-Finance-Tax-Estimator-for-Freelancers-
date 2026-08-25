const { Op } = require('sequelize');
const { Transaction, User, TaxEvent } = require('../models');
const AppError = require('../utils/AppError');
const { roundToTwo, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const normalizeCountryKey = (countryStr) => {
  const c = String(countryStr || '').toLowerCase().trim();
  if (c === 'india' || c === 'in') return 'india';
  if (c === 'usa' || c === 'united states' || c === 'us') return 'usa';
  if (c === 'canada' || c === 'ca') return 'canada';
  if (c === 'uk' || c === 'united kingdom' || c === 'gb') return 'uk';
  return 'default';
};

const taxRules = {
  india: {
    standardDeduction: 75000,
    deductibleExpenseCap: 0.7,
    rebate87ALimit: 700000,
    brackets: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.10 },
      { upTo: 1500000, rate: 0.15 },
      { upTo: 2000000, rate: 0.20 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: Infinity, rate: 0.30 }
    ]
  },
  usa: {
    standardDeduction: 14600,
    deductibleExpenseCap: 0.8,
    brackets: [
      { upTo: 11600, rate: 0.10 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 }
    ]
  },
  canada: {
    standardDeduction: 15705,
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
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 0.20 },
      { upTo: 125140, rate: 0.40 },
      { upTo: Infinity, rate: 0.45 }
    ]
  },
  default: {
    standardDeduction: 10000,
    deductibleExpenseCap: 0.7,
    brackets: [
      { upTo: 30000, rate: 0.05 },
      { upTo: 70000, rate: 0.12 },
      { upTo: 150000, rate: 0.20 },
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
  const countryKey = normalizeCountryKey(query.country || user.country || 'india');
  const rules = taxRules[countryKey] || taxRules.default;
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

  let estimatedTax = computeTax(taxableIncome, rules.brackets);
  if (countryKey === 'india' && taxableIncome <= (rules.rebate87ALimit || 700000)) {
    estimatedTax = 0;
  }

  const effectiveTaxRate = annualizedIncome > 0 ? roundToTwo((estimatedTax / annualizedIncome) * 100) : 0;

  const result = {
    year,
    jurisdiction: countryKey,
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
  const countryKey = normalizeCountryKey(payload.country || userObj?.country || 'india');
  const rules = taxRules[countryKey] || taxRules.default;

  const grossIncome = Number(payload.grossIncome || 0);
  const businessExpenses = Number(payload.businessExpenses || 0);
  const retirementContributions = Number(payload.retirementContributions || 0);
  const healthInsurance = Number(payload.healthInsurance || payload.healthInsurancePremiums || 0);
  const homeOfficeDeduction = Number(payload.homeOfficeDeduction || 0);

  const totalDeductions = roundToTwo(businessExpenses + retirementContributions + healthInsurance + homeOfficeDeduction);

  const annualGrossIncome = grossIncome * 4;
  const annualDeductions = totalDeductions * 4;
  const annualTaxableIncome = Math.max(0, annualGrossIncome - annualDeductions - rules.standardDeduction);

  let annualTax = computeTax(annualTaxableIncome, rules.brackets);
  if (countryKey === 'india' && annualTaxableIncome <= (rules.rebate87ALimit || 700000)) {
    annualTax = 0;
  }

  const estimatedQuarterlyTax = roundToTwo(annualTax / 4);
  const quarterlyTaxableIncome = roundToTwo(annualTaxableIncome / 4);
  const effectiveTaxRate = grossIncome > 0 ? roundToTwo((estimatedQuarterlyTax / grossIncome) * 100) : 0;
  const monthlySetAside = roundToTwo(estimatedQuarterlyTax / 3);

  // Persist calculation into TaxEstimate MySQL table
  try {
    const { TaxEstimate } = require('../models');
    await TaxEstimate.create({
      userId,
      country: payload.country || userObj?.country || 'India',
      state: payload.state || 'Maharashtra',
      filingStatus: payload.filingStatus || 'Single',
      quarter: payload.quarter || 'Q1',
      grossIncomeForQuarter: grossIncome,
      businessExpenses,
      retirementContribution: retirementContributions,
      healthInsurancePremiums: healthInsurance,
      homeOfficeDeduction,
      estimatedTax: estimatedQuarterlyTax,
      dueDate: new Date().toISOString().slice(0, 10)
    });
  } catch (e) {
    console.warn('Notice: Tax estimate record persistence:', e.message);
  }

  return {
    country: payload.country || userObj?.country || 'India',
    state: payload.state || 'Maharashtra',
    filingStatus: payload.filingStatus || 'Single',
    quarter: payload.quarter || 'Q1 (Jan-Mar)',
    grossIncome: roundToTwo(grossIncome),
    deductions: {
      businessExpenses: roundToTwo(businessExpenses),
      retirementContributions: roundToTwo(retirementContributions),
      healthInsurance: roundToTwo(healthInsurance),
      homeOfficeDeduction: roundToTwo(homeOfficeDeduction),
      totalDeductions
    },
    taxSummary: {
      standardDeduction: roundToTwo(rules.standardDeduction / 4),
      taxableIncome: quarterlyTaxableIncome,
      estimatedQuarterlyTax,
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

const getDefaultDeadlinesForCountry = (country, year) => {
  const c = normalizeCountryKey(country);
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

  if (events.length === 0) {
    const defaults = getDefaultDeadlinesForCountry(country, year);
    const toInsert = defaults.map((d) => ({
      ...d,
      userId,
      completed: false
    }));
    await TaxEvent.bulkCreate(toInsert);

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
  calculateQuarterlyTax,
  computeTax,
  createTaxEvent,
  deleteTaxEvent,
  getOrCreateTaxEvents,
  getTaxCalendar,
  getTaxEstimate,
  updateTaxEvent
};
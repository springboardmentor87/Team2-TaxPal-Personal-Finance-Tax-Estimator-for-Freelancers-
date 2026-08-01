const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { Transaction } = require('../models');
const { getTaxEstimate } = require('./taxService');
const { getDashboardSummary, getDashboardAnalytics } = require('./dashboardService');
const { buildDateRange, roundToTwo, sum } = require('../utils/finance');
const { serializeDocuments } = require('../utils/serialize');

const escapeCsv = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const toCsv = (rows = [], columns = []) => {
  const header = columns.map((column) => escapeCsv(column.label)).join(',');
  const lines = rows.map((row) => columns.map((column) => escapeCsv(column.value(row))).join(','));
  return [header, ...lines].join('\n');
};

const createPdfBuffer = (title, sections = []) => {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.fontSize(22).text(title, { align: 'left' });
    document.moveDown();

    sections.forEach((section) => {
      document.fontSize(15).text(section.title);
      document.moveDown(0.25);

      if (section.lines) {
        section.lines.forEach((line) => {
          document.fontSize(11).text(line);
        });
      }

      if (section.rows) {
        section.rows.forEach((row) => {
          document.fontSize(10).text(row);
        });
      }

      document.moveDown();
    });

    document.end();
  });
};

const fetchTransactions = async (userId, query = {}) => {
  const where = {
    userId
  };

  if (query.type) {
    where.type = query.type;
  }

  if (query.category) {
    where.category = String(query.category).trim();
  }

  const range = buildDateRange(query.from, query.to);
  if (range) {
    where.date = {};
    if (range.$gte) where.date[Op.gte] = range.$gte;
    if (range.$lte) where.date[Op.lte] = range.$lte;
  }

  const rawTransactions = await Transaction.findAll({
    where,
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  return serializeDocuments(rawTransactions);
};

const buildTransactionsReport = async (userId, query = {}) => {
  const transactions = await fetchTransactions(userId, query);
  const totalIncome = roundToTwo(sum(transactions.filter((transaction) => transaction.type === 'income').map((transaction) => transaction.amount)));
  const totalExpenses = roundToTwo(sum(transactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.amount)));
  const rows = transactions.map((transaction) => ({
    date: transaction.date,
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description || ''
  }));

  return {
    transactions,
    summary: {
      count: transactions.length,
      income: totalIncome,
      expenses: totalExpenses,
      net: roundToTwo(totalIncome - totalExpenses)
    },
    csv: toCsv(rows, [
      { label: 'Date', value: (row) => new Date(row.date).toISOString() },
      { label: 'Type', value: (row) => row.type },
      { label: 'Category', value: (row) => row.category },
      { label: 'Amount', value: (row) => row.amount },
      { label: 'Description', value: (row) => row.description }
    ]),
    pdf: await createPdfBuffer('Transactions Report', [
      {
        title: 'Summary',
        lines: [
          `Total transactions: ${transactions.length}`,
          `Income: ${totalIncome}`,
          `Expenses: ${totalExpenses}`,
          `Net cash flow: ${roundToTwo(totalIncome - totalExpenses)}`
        ]
      },
      {
        title: 'Transactions',
        rows: rows.slice(0, 40).map((row) => `${new Date(row.date).toISOString()} | ${row.type} | ${row.category} | ${row.amount} | ${row.description}`)
      }
    ])
  };
};

const buildDashboardReport = async (userId) => {
  const summary = await getDashboardSummary(userId);
  const analytics = await getDashboardAnalytics(userId);

  const csv = toCsv(analytics.monthlyAnalytics, [
    { label: 'Month', value: (row) => row.month },
    { label: 'Income', value: (row) => row.income },
    { label: 'Expenses', value: (row) => row.expenses },
    { label: 'Net', value: (row) => row.net },
    { label: 'Savings Rate', value: (row) => row.savingsRate }
  ]);

  const pdf = await createPdfBuffer('Dashboard Report', [
    {
      title: 'Summary',
      lines: [
        `Monthly income: ${summary.summary.monthlyIncome}`,
        `Monthly expenses: ${summary.summary.monthlyExpenses}`,
        `Net cash flow: ${summary.summary.netCashFlow}`,
        `Savings rate: ${summary.summary.savingsRate}`
      ]
    }
  ]);

  return {
    summary,
    analytics,
    csv,
    pdf
  };
};

const buildTaxReport = async (userId, query = {}) => {
  const estimate = await getTaxEstimate(userId, query);
  const csv = toCsv([
    {
      item: 'Annualized income',
      value: estimate.income.annualized
    },
    {
      item: 'Deductible expenses',
      value: estimate.expenses.deductible
    },
    {
      item: 'Taxable income',
      value: estimate.tax.taxableIncome
    },
    {
      item: 'Estimated tax',
      value: estimate.tax.estimatedTax
    }
  ], [
    { label: 'Item', value: (row) => row.item },
    { label: 'Value', value: (row) => row.value }
  ]);

  const pdf = await createPdfBuffer('Tax Estimate Report', [
    {
      title: 'Estimate',
      lines: [
        `Jurisdiction: ${estimate.jurisdiction}`,
        `Annualized income: ${estimate.income.annualized}`,
        `Deductible expenses: ${estimate.expenses.deductible}`,
        `Taxable income: ${estimate.tax.taxableIncome}`,
        `Estimated tax: ${estimate.tax.estimatedTax}`,
        `Effective tax rate: ${estimate.tax.effectiveTaxRate}`
      ]
    }
  ]);

  return {
    estimate,
    csv,
    pdf
  };
};

module.exports = {
  buildDashboardReport,
  buildTaxReport,
  buildTransactionsReport,
  createPdfBuffer,
  toCsv
};
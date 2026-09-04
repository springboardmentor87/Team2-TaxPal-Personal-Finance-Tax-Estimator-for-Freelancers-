const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Transaction, Report } = require('../models');
const { getTaxEstimate } = require('./taxService');
const { getDashboardSummary, getDashboardAnalytics } = require('./dashboardService');
const { buildDateRange, roundToTwo, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');
const AppError = require('../utils/AppError');

const REPORTS_DIR = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

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

const getPeriodDates = (periodStr = 'Current Month') => {
  const now = new Date();
  const period = String(periodStr || 'Current Month').toLowerCase().trim();

  if (period.includes('previous month')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period.includes('quarter')) {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const end = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period.includes('year') || period.includes('ytd')) {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  // Default: Current Month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const fetchTransactions = async (userId, query = {}) => {
  const where = { userId };

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
  const totalIncome = roundToTwo(sum(transactions.filter((t) => t.type === 'income').map((t) => t.amount)));
  const totalExpenses = roundToTwo(sum(transactions.filter((t) => t.type === 'expense').map((t) => t.amount)));
  const rows = transactions.map((t) => ({
    date: t.date,
    type: t.type,
    category: t.category,
    amount: t.amount,
    description: t.description || ''
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
      { label: 'Date', value: (row) => new Date(row.date).toISOString().slice(0, 10) },
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
        rows: rows.slice(0, 40).map((row) => `${new Date(row.date).toISOString().slice(0, 10)} | ${row.type} | ${row.category} | ${row.amount} | ${row.description}`)
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

  const pdf = await createPdfBuffer('Dashboard Executive Summary Report', [
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

  return { summary, analytics, csv, pdf };
};

const buildTaxReport = async (userId, query = {}) => {
  const estimate = await getTaxEstimate(userId, query);
  const csv = toCsv([
    { item: 'Annualized income', value: estimate.income.annualized },
    { item: 'Deductible expenses', value: estimate.expenses.deductible },
    { item: 'Taxable income', value: estimate.tax.taxableIncome },
    { item: 'Estimated tax', value: estimate.tax.estimatedTax }
  ], [
    { label: 'Item', value: (row) => row.item },
    { label: 'Value', value: (row) => row.value }
  ]);

  const pdf = await createPdfBuffer('Tax Estimate Summary Report', [
    {
      title: 'Estimate',
      lines: [
        `Jurisdiction: ${estimate.jurisdiction}`,
        `Annualized income: ${estimate.income.annualized}`,
        `Deductible expenses: ${estimate.expenses.deductible}`,
        `Taxable income: ${estimate.tax.taxableIncome}`,
        `Estimated tax: ${estimate.tax.estimatedTax}`,
        `Effective tax rate: ${estimate.tax.effectiveTaxRate}%`
      ]
    }
  ]);

  return { estimate, csv, pdf };
};

const generateReportRecord = async (userId, payload = {}) => {
  const reportType = payload.reportType || payload.type || 'Income Statement';
  const period = payload.period || 'Current Month';
  const format = String(payload.format || 'PDF').toUpperCase();

  const { start, end } = getPeriodDates(period);

  let reportData;
  if (reportType.toLowerCase().includes('tax')) {
    reportData = await buildTaxReport(userId, { from: start, to: end });
  } else if (reportType.toLowerCase().includes('dashboard') || reportType.toLowerCase().includes('executive')) {
    reportData = await buildDashboardReport(userId);
  } else {
    reportData = await buildTransactionsReport(userId, { from: start, to: end });
  }

  const fileExt = format === 'CSV' ? 'csv' : 'pdf';
  const filename = `report_${userId}_${Date.now()}.${fileExt}`;
  const filePath = path.join(REPORTS_DIR, filename);

  const fileContent = format === 'CSV' ? reportData.csv : reportData.pdf;
  fs.writeFileSync(filePath, fileContent);

  const newReport = await Report.create({
    userId,
    period,
    reportType,
    filePath: filename,
    format
  });

  return serializeDocument(newReport);
};

const getReportsList = async (userId) => {
  const reports = await Report.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });

  return serializeDocuments(reports);
};

const getReportById = async (userId, reportId) => {
  const reportObj = await Report.findOne({
    where: { id: reportId, userId }
  });

  if (!reportObj) {
    throw new AppError('Report not found', 404);
  }

  const report = serializeDocument(reportObj);
  const fullPath = path.join(REPORTS_DIR, report.filePath);

  if (!fs.existsSync(fullPath)) {
    throw new AppError('Report file not found on disk', 404);
  }

  return {
    report,
    fullPath,
    content: fs.readFileSync(fullPath)
  };
};

const deleteReportById = async (userId, reportId) => {
  const reportObj = await Report.findOne({
    where: { id: reportId, userId }
  });

  if (!reportObj) {
    throw new AppError('Report not found', 404);
  }

  const report = serializeDocument(reportObj);
  if (report.filePath) {
    const fullPath = path.join(REPORTS_DIR, report.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  await reportObj.destroy();
  return { success: true, message: 'Report deleted successfully' };
};

const getReportPreviewData = async (userId, reportId) => {
  const reportObj = await Report.findOne({
    where: { id: reportId, userId }
  });

  if (!reportObj) {
    throw new AppError('Report not found', 404);
  }

  const report = serializeDocument(reportObj);
  const { start, end } = getPeriodDates(report.period);

  let previewDetails = null;
  if (report.reportType.toLowerCase().includes('tax')) {
    const taxData = await buildTaxReport(userId, { from: start, to: end });
    previewDetails = {
      type: 'tax',
      estimate: taxData.estimate,
      lines: [
        { label: 'Jurisdiction', value: String(taxData.estimate.jurisdiction || 'INDIA').toUpperCase() },
        { label: 'Annualized Income', value: `₹${taxData.estimate.income?.annualized || 0}` },
        { label: 'Deductible Expenses', value: `₹${taxData.estimate.expenses?.deductible || 0}` },
        { label: 'Taxable Income', value: `₹${taxData.estimate.tax?.taxableIncome || 0}` },
        { label: 'Estimated Tax', value: `₹${taxData.estimate.tax?.estimatedTax || 0}` },
        { label: 'Effective Tax Rate', value: `${taxData.estimate.tax?.effectiveTaxRate || 0}%` }
      ]
    };
  } else if (report.reportType.toLowerCase().includes('dashboard') || report.reportType.toLowerCase().includes('executive')) {
    const dashData = await buildDashboardReport(userId);
    previewDetails = {
      type: 'dashboard',
      summary: dashData.summary?.summary,
      lines: [
        { label: 'Monthly Income', value: `₹${dashData.summary?.summary?.monthlyIncome || 0}` },
        { label: 'Monthly Expenses', value: `₹${dashData.summary?.summary?.monthlyExpenses || 0}` },
        { label: 'Net Cash Flow', value: `₹${dashData.summary?.summary?.netCashFlow || 0}` },
        { label: 'Savings Rate', value: `${dashData.summary?.summary?.savingsRate || 0}%` }
      ]
    };
  } else if (report.reportType.toLowerCase().includes('expense')) {
    let transData = await buildTransactionsReport(userId, { from: start, to: end });
    if (transData.transactions.length === 0) {
      transData = await buildTransactionsReport(userId, {});
    }
    const expenses = transData.transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
    });
    const categoryLines = Object.keys(categoryTotals).map(cat => ({
      label: cat,
      value: `₹${categoryTotals[cat]}`
    }));
    previewDetails = {
      type: 'expense',
      summary: transData.summary,
      lines: categoryLines.length > 0 ? categoryLines : [{ label: 'Total Expenses', value: `₹${transData.summary.expenses || 0}` }],
      transactions: expenses.slice(0, 15)
    };
  } else {
    let transData = await buildTransactionsReport(userId, { from: start, to: end });
    if (transData.transactions.length === 0) {
      transData = await buildTransactionsReport(userId, {});
    }
    previewDetails = {
      type: 'transactions',
      summary: transData.summary,
      transactions: transData.transactions.slice(0, 15)
    };
  }

  return {
    report,
    preview: previewDetails
  };
};

module.exports = {
  buildDashboardReport,
  buildTaxReport,
  buildTransactionsReport,
  createPdfBuffer,
  deleteReportById,
  generateReportRecord,
  getReportById,
  getReportPreviewData,
  getReportsList,
  toCsv
};
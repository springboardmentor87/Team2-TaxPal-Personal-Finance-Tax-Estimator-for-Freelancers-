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

// Executive Styled PDF Builder using PDFKit
const createStyledPdfBuffer = ({ title, period, summaryCards = [], columns = [], rows = [] }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const generatedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // 1. Header Banner
    doc.fillColor('#6D28D9').fontSize(22).font('Helvetica-Bold').text('TaxPal', 40, 40);
    doc.fillColor('#1E1533').fontSize(16).font('Helvetica-Bold').text(title, 40, 68);
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(`Period: ${period || 'Current Month'}   |   Generated: ${generatedDate}`, 40, 90);

    doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#E5E7EB').lineWidth(1).stroke();

    let currentY = 120;

    // 2. Summary Boxes Grid
    if (summaryCards.length > 0) {
      const cardCount = summaryCards.length;
      const totalWidth = 515;
      const gap = 12;
      const boxWidth = (totalWidth - (cardCount - 1) * gap) / cardCount;

      summaryCards.forEach((card, idx) => {
        const xPos = 40 + idx * (boxWidth + gap);
        doc.roundedRect(xPos, currentY, boxWidth, 48, 6).fillAndStroke('#FBF9FE', '#EDE9FE');
        doc.fillColor('#6B7280').fontSize(8).font('Helvetica-Bold').text(String(card.label).toUpperCase(), xPos + 10, currentY + 10);
        doc.fillColor('#1E1533').fontSize(13).font('Helvetica-Bold').text(String(card.value), xPos + 10, currentY + 25);
      });
      currentY += 65;
    }

    // 3. Table Header
    if (columns.length > 0) {
      doc.rect(40, currentY, 515, 24).fill('#6D28D9');
      let xOffset = 45;
      columns.forEach((col) => {
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold').text(col.label.toUpperCase(), xOffset, currentY + 7, {
          width: col.width - 10,
          align: col.align || 'left'
        });
        xOffset += col.width;
      });
      currentY += 24;

      // Table Rows
      if (rows.length === 0) {
        doc.rect(40, currentY, 515, 26).fill('#FAFAFA');
        doc.fillColor('#9CA3AF').fontSize(9).font('Helvetica').text('No transactions recorded for this period.', 45, currentY + 8);
        currentY += 26;
      } else {
        rows.forEach((row, rowIdx) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
          }
          const bg = rowIdx % 2 === 0 ? '#FFFFFF' : '#FBF9FE';
          doc.rect(40, currentY, 515, 22).fill(bg);

          let cellX = 45;
          columns.forEach((col) => {
            const val = col.value(row);
            doc.fillColor('#374151').fontSize(8.5).font('Helvetica').text(String(val), cellX, currentY + 6, {
              width: col.width - 10,
              align: col.align || 'left'
            });
            cellX += col.width;
          });

          doc.moveTo(40, currentY + 22).lineTo(555, currentY + 22).strokeColor('#F3F4F6').lineWidth(0.5).stroke();
          currentY += 22;
        });
      }
    }

    // Footer
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica').text('TaxPal Personal Finance & Tax Estimator', 40, 800, { align: 'center' });

    doc.end();
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

// 1. Income Statement Builder (Income ONLY)
const buildIncomeStatementReport = async (userId, query = {}, periodName = 'Current Month') => {
  const transactions = await fetchTransactions(userId, { ...query, type: 'income' });
  const totalIncome = roundToTwo(sum(transactions.map((t) => t.amount)));
  const rows = transactions.map((t) => ({
    date: new Date(t.date).toISOString().slice(0, 10),
    category: t.category,
    amount: `+₹${t.amount}`,
    description: t.description || '-'
  }));

  const csv = toCsv(rows, [
    { label: 'Date', value: (r) => r.date },
    { label: 'Category', value: (r) => r.category },
    { label: 'Amount', value: (r) => r.amount },
    { label: 'Description', value: (r) => r.description }
  ]);

  const pdf = await createStyledPdfBuffer({
    title: 'Income Statement Report',
    period: periodName,
    summaryCards: [
      { label: 'Total Income', value: `₹${totalIncome}` },
      { label: 'Total Receipts', value: `${transactions.length}` }
    ],
    columns: [
      { label: 'Date', width: 90, value: (r) => r.date },
      { label: 'Category', width: 130, value: (r) => r.category },
      { label: 'Description', width: 195, value: (r) => r.description },
      { label: 'Amount', width: 100, align: 'right', value: (r) => r.amount }
    ],
    rows
  });

  return {
    transactions,
    summary: { totalIncome, count: transactions.length },
    csv,
    pdf
  };
};

// 2. Expense Breakdown Builder (Expenses ONLY)
const buildExpenseBreakdownReport = async (userId, query = {}, periodName = 'Current Month') => {
  const transactions = await fetchTransactions(userId, { ...query, type: 'expense' });
  const totalExpenses = roundToTwo(sum(transactions.map((t) => t.amount)));

  const categoryTotals = {};
  transactions.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
  });

  const categoryRows = Object.keys(categoryTotals).map((cat) => ({
    category: cat,
    total: categoryTotals[cat],
    formattedTotal: `₹${categoryTotals[cat]}`,
    percentage: totalExpenses > 0 ? `${roundToTwo((categoryTotals[cat] / totalExpenses) * 100)}%` : '0%'
  }));

  const transactionRows = transactions.map((t) => ({
    date: new Date(t.date).toISOString().slice(0, 10),
    category: t.category,
    amount: `-₹${t.amount}`,
    description: t.description || '-'
  }));

  const csv = toCsv(categoryRows, [
    { label: 'Category', value: (r) => r.category },
    { label: 'Total Expense', value: (r) => r.total },
    { label: 'Percentage', value: (r) => r.percentage }
  ]);

  const pdf = await createStyledPdfBuffer({
    title: 'Expense Breakdown Report',
    period: periodName,
    summaryCards: [
      { label: 'Total Expenses', value: `₹${totalExpenses}` },
      { label: 'Categories', value: `${categoryRows.length}` },
      { label: 'Transactions', value: `${transactions.length}` }
    ],
    columns: [
      { label: 'Date', width: 90, value: (r) => r.date },
      { label: 'Category', width: 130, value: (r) => r.category },
      { label: 'Description', width: 195, value: (r) => r.description },
      { label: 'Amount', width: 100, align: 'right', value: (r) => r.amount }
    ],
    rows: transactionRows
  });

  return {
    transactions,
    categoryRows,
    summary: { totalExpenses, count: transactions.length },
    csv,
    pdf
  };
};

// 3. Transaction History Builder (All Transactions)
const buildTransactionsReport = async (userId, query = {}, periodName = 'Current Month') => {
  const transactions = await fetchTransactions(userId, query);
  const totalIncome = roundToTwo(sum(transactions.filter((t) => t.type === 'income').map((t) => t.amount)));
  const totalExpenses = roundToTwo(sum(transactions.filter((t) => t.type === 'expense').map((t) => t.amount)));
  const rows = transactions.map((t) => ({
    date: new Date(t.date).toISOString().slice(0, 10),
    type: t.type.toUpperCase(),
    category: t.category,
    amount: t.type === 'income' ? `+₹${t.amount}` : `-₹${t.amount}`,
    description: t.description || '-'
  }));

  const csv = toCsv(rows, [
    { label: 'Date', value: (r) => r.date },
    { label: 'Type', value: (r) => r.type },
    { label: 'Category', value: (r) => r.category },
    { label: 'Amount', value: (r) => r.amount },
    { label: 'Description', value: (r) => r.description }
  ]);

  const pdf = await createStyledPdfBuffer({
    title: 'Transaction History Report',
    period: periodName,
    summaryCards: [
      { label: 'Total Income', value: `₹${totalIncome}` },
      { label: 'Total Expenses', value: `₹${totalExpenses}` },
      { label: 'Net Cash Flow', value: `₹${roundToTwo(totalIncome - totalExpenses)}` }
    ],
    columns: [
      { label: 'Date', width: 85, value: (r) => r.date },
      { label: 'Type', width: 65, value: (r) => r.type },
      { label: 'Category', width: 125, value: (r) => r.category },
      { label: 'Description', width: 140, value: (r) => r.description },
      { label: 'Amount', width: 100, align: 'right', value: (r) => r.amount }
    ],
    rows
  });

  return {
    transactions,
    summary: {
      count: transactions.length,
      income: totalIncome,
      expenses: totalExpenses,
      net: roundToTwo(totalIncome - totalExpenses)
    },
    csv,
    pdf
  };
};

const buildDashboardReport = async (userId) => {
  const summary = await getDashboardSummary(userId);
  const analytics = await getDashboardAnalytics(userId);

  const csv = toCsv(analytics.monthlyAnalytics, [
    { label: 'Month', value: (r) => r.month },
    { label: 'Income', value: (r) => r.income },
    { label: 'Expenses', value: (r) => r.expenses },
    { label: 'Net', value: (r) => r.net },
    { label: 'Savings Rate', value: (r) => r.savingsRate }
  ]);

  const pdf = await createStyledPdfBuffer({
    title: 'Executive Dashboard Report',
    period: 'Current Year',
    summaryCards: [
      { label: 'Monthly Income', value: `₹${summary.summary.monthlyIncome || 0}` },
      { label: 'Monthly Expenses', value: `₹${summary.summary.monthlyExpenses || 0}` },
      { label: 'Net Cash Flow', value: `₹${summary.summary.netCashFlow || 0}` },
      { label: 'Savings Rate', value: `${summary.summary.savingsRate || 0}%` }
    ],
    columns: [
      { label: 'Month', width: 100, value: (r) => r.month },
      { label: 'Income', width: 100, align: 'right', value: (r) => `₹${r.income}` },
      { label: 'Expenses', width: 100, align: 'right', value: (r) => `₹${r.expenses}` },
      { label: 'Net', width: 100, align: 'right', value: (r) => `₹${r.net}` },
      { label: 'Savings Rate', width: 115, align: 'right', value: (r) => `${r.savingsRate}%` }
    ],
    rows: analytics.monthlyAnalytics || []
  });

  return { summary, analytics, csv, pdf };
};

const buildTaxReport = async (userId, query = {}, periodName = 'Current Year') => {
  const estimate = await getTaxEstimate(userId, query);
  const rows = [
    { item: 'Jurisdiction', value: String(estimate.jurisdiction || 'India').toUpperCase() },
    { item: 'Annualized Income', value: `₹${estimate.income?.annualized || 0}` },
    { item: 'Deductible Expenses', value: `₹${estimate.expenses?.deductible || 0}` },
    { item: 'Taxable Income', value: `₹${estimate.tax?.taxableIncome || 0}` },
    { item: 'Estimated Tax', value: `₹${estimate.tax?.estimatedTax || 0}` },
    { item: 'Effective Tax Rate', value: `${estimate.tax?.effectiveTaxRate || 0}%` }
  ];

  const csv = toCsv(rows, [
    { label: 'Item', value: (r) => r.item },
    { label: 'Value', value: (r) => r.value }
  ]);

  const pdf = await createStyledPdfBuffer({
    title: 'Tax Summary & Estimate Report',
    period: periodName,
    summaryCards: [
      { label: 'Annualized Income', value: `₹${estimate.income?.annualized || 0}` },
      { label: 'Taxable Income', value: `₹${estimate.tax?.taxableIncome || 0}` },
      { label: 'Estimated Tax', value: `₹${estimate.tax?.estimatedTax || 0}` }
    ],
    columns: [
      { label: 'Tax Metric / Breakdown Line Item', width: 315, value: (r) => r.item },
      { label: 'Calculated Amount', width: 200, align: 'right', value: (r) => r.value }
    ],
    rows
  });

  return { estimate, csv, pdf };
};

const generateReportRecord = async (userId, payload = {}) => {
  const reportType = payload.reportType || payload.type || 'Income Statement';
  const period = payload.period || 'Current Month';
  const format = String(payload.format || 'PDF').toUpperCase();

  const { start, end } = getPeriodDates(period);

  let reportData;
  if (reportType.toLowerCase().includes('income')) {
    reportData = await buildIncomeStatementReport(userId, { from: start, to: end }, period);
  } else if (reportType.toLowerCase().includes('expense')) {
    reportData = await buildExpenseBreakdownReport(userId, { from: start, to: end }, period);
  } else if (reportType.toLowerCase().includes('tax')) {
    reportData = await buildTaxReport(userId, { from: start, to: end }, period);
  } else if (reportType.toLowerCase().includes('dashboard') || reportType.toLowerCase().includes('executive')) {
    reportData = await buildDashboardReport(userId);
  } else {
    reportData = await buildTransactionsReport(userId, { from: start, to: end }, period);
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
  if (report.reportType.toLowerCase().includes('income')) {
    const incomeData = await buildIncomeStatementReport(userId, { from: start, to: end }, report.period);
    previewDetails = {
      type: 'income',
      summary: incomeData.summary,
      transactions: incomeData.transactions
    };
  } else if (report.reportType.toLowerCase().includes('expense')) {
    const expenseData = await buildExpenseBreakdownReport(userId, { from: start, to: end }, report.period);
    previewDetails = {
      type: 'expense',
      summary: expenseData.summary,
      lines: expenseData.categoryRows.map((c) => ({ label: c.category, value: `₹${c.total} (${c.percentage})` })),
      transactions: expenseData.transactions
    };
  } else if (report.reportType.toLowerCase().includes('tax')) {
    const taxData = await buildTaxReport(userId, { from: start, to: end }, report.period);
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
  } else {
    const transData = await buildTransactionsReport(userId, { from: start, to: end }, report.period);
    previewDetails = {
      type: 'transactions',
      summary: transData.summary,
      transactions: transData.transactions
    };
  }

  return {
    report,
    preview: previewDetails
  };
};

module.exports = {
  buildDashboardReport,
  buildExpenseBreakdownReport,
  buildIncomeStatementReport,
  buildTaxReport,
  buildTransactionsReport,
  createStyledPdfBuffer,
  deleteReportById,
  generateReportRecord,
  getReportById,
  getReportPreviewData,
  getReportsList,
  toCsv
};
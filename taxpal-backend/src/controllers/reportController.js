const asyncHandler = require('../utils/asyncHandler');
const { buildDashboardReport, buildTaxReport, buildTransactionsReport } = require('../services/reportService');

const sendReport = (res, filename, contentType, content) => {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);

  return res.status(200).send(content);
};

const downloadTransactionsReport = asyncHandler(async (req, res) => {
  const report = await buildTransactionsReport(req.userId, req.query);
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    return sendReport(res, 'transactions-report.pdf', 'application/pdf', report.pdf);
  }

  return sendReport(res, 'transactions-report.csv', 'text/csv; charset=utf-8', report.csv);
});

const downloadDashboardReport = asyncHandler(async (req, res) => {
  const report = await buildDashboardReport(req.userId);
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    return sendReport(res, 'dashboard-report.pdf', 'application/pdf', report.pdf);
  }

  return sendReport(res, 'dashboard-report.csv', 'text/csv; charset=utf-8', report.csv);
});

const downloadTaxReport = asyncHandler(async (req, res) => {
  const report = await buildTaxReport(req.userId, req.query);
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    return sendReport(res, 'tax-report.pdf', 'application/pdf', report.pdf);
  }

  return sendReport(res, 'tax-report.csv', 'text/csv; charset=utf-8', report.csv);
});

module.exports = {
  downloadDashboardReport,
  downloadTaxReport,
  downloadTransactionsReport
};
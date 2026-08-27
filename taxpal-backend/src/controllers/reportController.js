const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  buildDashboardReport,
  buildTaxReport,
  buildTransactionsReport,
  deleteReportById,
  generateReportRecord,
  getReportById,
  getReportsList
} = require('../services/reportService');

const sendReportFile = (res, filename, format, content) => {
  const isPdf = String(format || '').toLowerCase() === 'pdf';
  const contentType = isPdf ? 'application/pdf' : 'text/csv; charset=utf-8';

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);

  return res.status(200).send(content);
};

const getReportsController = asyncHandler(async (req, res) => {
  const reports = await getReportsList(req.userId);
  return sendSuccess(res, 200, 'Reports fetched successfully', reports);
});

const generateReportController = asyncHandler(async (req, res) => {
  const report = await generateReportRecord(req.userId, req.body);
  return sendSuccess(res, 201, 'Report generated successfully', report);
});

const downloadReportByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { report, content } = await getReportById(req.userId, id);
  return sendReportFile(res, report.filePath || `report_${id}.${report.format.toLowerCase()}`, report.format, content);
});

const previewReportByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { report, content } = await getReportById(req.userId, id);

  if (String(report.format).toLowerCase() === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    return res.status(200).send(content);
  }

  return sendSuccess(res, 200, 'Report preview fetched', {
    report,
    content: content.toString('utf-8')
  });
});

const deleteReportController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteReportById(req.userId, id);
  return sendSuccess(res, 200, result.message, null);
});

const downloadTransactionsReport = asyncHandler(async (req, res) => {
  const report = await buildTransactionsReport(req.userId, req.query);
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    return sendReportFile(res, 'transactions-report.pdf', 'pdf', report.pdf);
  }

  return sendReportFile(res, 'transactions-report.csv', 'csv', report.csv);
});

const downloadDashboardReport = asyncHandler(async (req, res) => {
  const report = await buildDashboardReport(req.userId);
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    return sendReportFile(res, 'dashboard-report.pdf', 'pdf', report.pdf);
  }

  return sendReportFile(res, 'dashboard-report.csv', 'csv', report.csv);
});

const downloadTaxReport = asyncHandler(async (req, res) => {
  const report = await buildTaxReport(req.userId, req.query);
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    return sendReportFile(res, 'tax-report.pdf', 'pdf', report.pdf);
  }

  return sendReportFile(res, 'tax-report.csv', 'csv', report.csv);
});

module.exports = {
  deleteReport: deleteReportController,
  downloadDashboardReport,
  downloadReportById: downloadReportByIdController,
  downloadTaxReport,
  downloadTransactionsReport,
  generateReport: generateReportController,
  getReports: getReportsController,
  previewReport: previewReportByIdController
};
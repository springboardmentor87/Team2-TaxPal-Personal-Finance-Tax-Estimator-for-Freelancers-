const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  createAlert: createAlertService,
  deleteAlert: deleteAlertService,
  getAlertById,
  listAlerts,
  markAlertRead,
  refreshAlerts,
  resolveAlert,
  updateAlert: updateAlertService
} = require('../services/alertService');

const createAlert = asyncHandler(async (req, res) => {
  const alert = await createAlertService(req.userId, req.body);
  return sendSuccess(res, 201, 'Alert created successfully', alert);
});

const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await listAlerts(req.userId, req.query);
  return sendSuccess(res, 200, 'Alerts fetched successfully', {
    items: alerts
  });
});

const getAlert = asyncHandler(async (req, res) => {
  const alert = await getAlertById(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Alert fetched successfully', alert);
});

const updateAlert = asyncHandler(async (req, res) => {
  const alert = await updateAlertService(req.userId, req.params.id, req.body);
  return sendSuccess(res, 200, 'Alert updated successfully', alert);
});

const deleteAlert = asyncHandler(async (req, res) => {
  await deleteAlertService(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Alert deleted successfully');
});

const markAsRead = asyncHandler(async (req, res) => {
  const alert = await markAlertRead(req.userId, req.params.id, true);
  return sendSuccess(res, 200, 'Alert marked as read', alert);
});

const markAsResolved = asyncHandler(async (req, res) => {
  const alert = await resolveAlert(req.userId, req.params.id, true);
  return sendSuccess(res, 200, 'Alert resolved successfully', alert);
});

const refresh = asyncHandler(async (req, res) => {
  const alerts = await refreshAlerts(req.userId);
  return sendSuccess(res, 200, 'Alerts refreshed successfully', {
    items: alerts
  });
});

module.exports = {
  createAlert,
  deleteAlert,
  getAlert,
  getAlerts,
  markAsRead,
  markAsResolved,
  refresh,
  updateAlert
};
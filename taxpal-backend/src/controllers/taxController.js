const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  getTaxEstimate,
  getOrCreateTaxEvents,
  createTaxEvent,
  updateTaxEvent,
  deleteTaxEvent
} = require('../services/taxService');

const getTaxEstimateController = asyncHandler(async (req, res) => {
  const estimate = await getTaxEstimate(req.userId, req.query);
  return sendSuccess(res, 200, 'Tax estimate fetched successfully', estimate);
});

const getCalendarEventsController = asyncHandler(async (req, res) => {
  const { country, year } = req.query;
  const events = await getOrCreateTaxEvents(req.userId, country, year);
  return sendSuccess(res, 200, 'Tax calendar events fetched successfully', events);
});

const createCalendarEventController = asyncHandler(async (req, res) => {
  const event = await createTaxEvent(req.userId, req.body);
  return sendSuccess(res, 201, 'Tax calendar event created successfully', event);
});

const updateCalendarEventController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await updateTaxEvent(req.userId, id, req.body);
  return sendSuccess(res, 200, 'Tax calendar event updated successfully', event);
});

const deleteCalendarEventController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteTaxEvent(req.userId, id);
  return sendSuccess(res, 200, result.message, null);
});

module.exports = {
  getTaxEstimate: getTaxEstimateController,
  getCalendarEvents: getCalendarEventsController,
  createCalendarEvent: createCalendarEventController,
  updateCalendarEvent: updateCalendarEventController,
  deleteCalendarEvent: deleteCalendarEventController
};
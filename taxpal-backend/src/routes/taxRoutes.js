const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  getTaxEstimate,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} = require('../controllers/taxController');

const router = express.Router();

router.use(protect);
router.get('/', getTaxEstimate);
router.get('/estimate', getTaxEstimate);

router.get('/calendar', getCalendarEvents);
router.post('/calendar', createCalendarEvent);
router.put('/calendar/:id', updateCalendarEvent);
router.delete('/calendar/:id', deleteCalendarEvent);

module.exports = router;
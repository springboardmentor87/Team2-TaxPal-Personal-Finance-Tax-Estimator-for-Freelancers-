const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createAlert,
  deleteAlert,
  getAlert,
  getAlerts,
  markAsRead,
  markAsResolved,
  refresh,
  updateAlert
} = require('../controllers/alertController');

const router = express.Router();

router.use(protect);
router.get('/refresh', refresh);
router.get('/', getAlerts);
router.get('/:id', getAlert);
router.post('/', createAlert);
router.patch('/:id/read', markAsRead);
router.patch('/:id/resolve', markAsResolved);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);

module.exports = router;
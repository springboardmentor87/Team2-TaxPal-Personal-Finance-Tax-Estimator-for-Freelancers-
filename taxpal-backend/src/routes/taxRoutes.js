const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getTaxEstimate } = require('../controllers/taxController');

const router = express.Router();

router.use(protect);
router.get('/', getTaxEstimate);
router.get('/estimate', getTaxEstimate);

module.exports = router;
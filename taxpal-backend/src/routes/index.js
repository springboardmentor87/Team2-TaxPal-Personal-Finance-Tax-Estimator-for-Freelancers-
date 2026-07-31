const express = require('express');
const authRoutes = require('./authRoutes');
const transactionRoutes = require('./transactionRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const budgetRoutes = require('./budgetRoutes');
const categoryRoutes = require('./categoryRoutes');
const taxRoutes = require('./taxRoutes');
const reportRoutes = require('./reportRoutes');
const alertRoutes = require('./alertRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/budgets', budgetRoutes);
router.use('/categories', categoryRoutes);
router.use('/tax', taxRoutes);
router.use('/reports', reportRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', alertRoutes);

module.exports = router;
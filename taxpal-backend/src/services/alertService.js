const { Op } = require('sequelize');
const { Alert, Transaction } = require('../models');
const AppError = require('../utils/AppError');
const { getBudgetOverview, listBudgets } = require('./budgetService');
const { getTaxEstimate } = require('./taxService');
const { roundToTwo, sum } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const normalizeAlertInput = (payload) => {
  const title = String(payload.title || '').trim();
  const message = String(payload.message || '').trim();
  const severity = String(payload.severity || 'info').trim().toLowerCase();
  const allowed = ['info', 'warning', 'critical'];

  if (!title) {
    throw new AppError('Alert title is required', 400);
  }

  if (!message) {
    throw new AppError('Alert message is required', 400);
  }

  if (!allowed.includes(severity)) {
    throw new AppError('Alert severity must be info, warning, or critical', 400);
  }

  return {
    title,
    message,
    severity,
    source: payload.source ? String(payload.source).trim() : 'manual',
    sourceKey: payload.sourceKey ? String(payload.sourceKey).trim() : null,
    read: payload.read !== undefined ? Boolean(payload.read) : false,
    resolved: payload.resolved !== undefined ? Boolean(payload.resolved) : false,
    metadata: payload.metadata || null
  };
};

const createAlert = async (userId, payload) => {
  const alertData = normalizeAlertInput(payload);

  if (alertData.sourceKey) {
    const existing = await Alert.findOne({
      where: { userId, sourceKey: alertData.sourceKey }
    });

    if (existing) {
      await existing.update(alertData);
      return serializeDocument(existing);
    }
  }

  const alert = await Alert.create({
    userId,
    ...alertData
  });

  return serializeDocument(alert);
};

const listAlerts = async (userId, query = {}) => {
  const where = { userId };

  if (query.read !== undefined) {
    where.read = query.read === 'true';
  }

  if (query.resolved !== undefined) {
    where.resolved = query.resolved === 'true';
  }

  if (query.severity) {
    where.severity = String(query.severity).trim().toLowerCase();
  }

  const alerts = await Alert.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  return serializeDocuments(alerts);
};

const getAlertById = async (userId, alertId) => {
  const alert = await Alert.findOne({
    where: {
      id: alertId,
      userId
    }
  });

  if (!alert) {
    throw new AppError('Alert not found', 404);
  }

  return serializeDocument(alert);
};

const updateAlert = async (userId, alertId, payload) => {
  const alert = await Alert.findOne({
    where: {
      id: alertId,
      userId
    }
  });

  if (!alert) {
    throw new AppError('Alert not found', 404);
  }

  const update = {};

  if (payload.title !== undefined) {
    update.title = String(payload.title).trim();
  }

  if (payload.message !== undefined) {
    update.message = String(payload.message).trim();
  }

  if (payload.severity !== undefined) {
    const severity = String(payload.severity).trim().toLowerCase();
    if (!['info', 'warning', 'critical'].includes(severity)) {
      throw new AppError('Alert severity must be info, warning, or critical', 400);
    }
    update.severity = severity;
  }

  if (payload.read !== undefined) {
    update.read = Boolean(payload.read);
  }

  if (payload.resolved !== undefined) {
    update.resolved = Boolean(payload.resolved);
  }

  if (payload.metadata !== undefined) {
    update.metadata = payload.metadata;
  }

  await alert.update(update);
  return serializeDocument(alert);
};

const deleteAlert = async (userId, alertId) => {
  const alert = await Alert.findOne({
    where: {
      id: alertId,
      userId
    }
  });

  if (!alert) {
    throw new AppError('Alert not found', 404);
  }

  const serialized = serializeDocument(alert);
  await alert.destroy();
  return serialized;
};

const markAlertRead = async (userId, alertId, read = true) => {
  return updateAlert(userId, alertId, { read });
};

const resolveAlert = async (userId, alertId, resolved = true) => {
  return updateAlert(userId, alertId, { resolved });
};

const refreshAlerts = async (userId) => {
  const [budgets, budgetOverview, taxEstimate, rawExpenses] = await Promise.all([
    listBudgets(userId),
    getBudgetOverview(userId),
    getTaxEstimate(userId, {}, { skipPersistence: true }),
    Transaction.findAll({
      where: {
        userId,
        type: 'expense'
      },
      order: [['date', 'DESC']],
      limit: 50
    })
  ]);

  const expenses = serializeDocuments(rawExpenses);
  const alerts = [];

  if (budgetOverview.activeBudgets === 0) {
    alerts.push({
      source: 'budget',
      sourceKey: 'budget-missing',
      severity: 'info',
      title: 'No active budgets configured',
      message: 'Add a few budgets to track category-level spending more accurately.',
      metadata: { totalBudgets: budgetOverview.totalBudgets }
    });
  }

  budgets
    .filter((budget) => budget.usage)
    .forEach((budget) => {
      if (budget.usage.status === 'over') {
        alerts.push({
          source: 'budget',
          sourceKey: `budget-over-${budget.id}`,
          severity: 'critical',
          title: `Budget exceeded: ${budget.name}`,
          message: `${budget.category} has spent ${budget.usage.spent} against a budget of ${budget.amount}.`,
          metadata: budget
        });
      } else if (budget.usage.status === 'warning') {
        alerts.push({
          source: 'budget',
          sourceKey: `budget-warning-${budget.id}`,
          severity: 'warning',
          title: `Budget nearing limit: ${budget.name}`,
          message: `${budget.category} is at ${budget.usage.utilization}% of the allocated amount.`,
          metadata: budget
        });
      }
    });

  if (taxEstimate.tax.estimatedTax > 0 && taxEstimate.tax.effectiveTaxRate > 25) {
    alerts.push({
      source: 'tax',
      sourceKey: `tax-pressure-${taxEstimate.year}`,
      severity: 'warning',
      title: 'Tax burden looks elevated',
      message: `Estimated tax for ${taxEstimate.year} is ${taxEstimate.tax.estimatedTax} with an effective rate of ${taxEstimate.tax.effectiveTaxRate}%.`,
      metadata: taxEstimate
    });
  }

  const monthlyExpenses = roundToTwo(sum(expenses.map((transaction) => transaction.amount)));
  if (monthlyExpenses > taxEstimate.income.annualized * 0.1) {
    alerts.push({
      source: 'cashflow',
      sourceKey: 'cashflow-expense-pressure',
      severity: 'warning',
      title: 'Expense pressure detected',
      message: 'Recent spending is running ahead of the projected income baseline.',
      metadata: {
        monthlyExpenses,
        annualizedIncome: taxEstimate.income.annualized
      }
    });
  }

  const persisted = [];
  for (const alert of alerts) {
    persisted.push(await createAlert(userId, alert));
  }

  return persisted;
};

module.exports = {
  createAlert,
  deleteAlert,
  getAlertById,
  listAlerts,
  markAlertRead,
  refreshAlerts,
  resolveAlert,
  updateAlert
};
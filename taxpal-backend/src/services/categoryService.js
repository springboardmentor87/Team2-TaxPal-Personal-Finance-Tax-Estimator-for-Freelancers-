const { Op } = require('sequelize');
const { Category, Transaction } = require('../models');
const AppError = require('../utils/AppError');
const { roundToTwo } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const normalizeCategoryInput = (payload) => {
  const name = String(payload.name || '').trim();

  if (!name) {
    throw new AppError('Category name is required', 400);
  }

  return {
    name,
    type: payload.type ? String(payload.type).trim() : 'expense',
    color: payload.color ? String(payload.color).trim() : '#2B6CB0',
    icon: payload.icon ? String(payload.icon).trim() : 'tag',
    description: payload.description ? String(payload.description).trim() : '',
    active: payload.active !== undefined ? Boolean(payload.active) : true
  };
};

const createCategory = async (userId, payload) => {
  const categoryData = normalizeCategoryInput(payload);

  const existing = await Category.findOne({
    where: {
      userId,
      name: categoryData.name
    }
  });

  if (existing) {
    throw new AppError('Category already exists', 409);
  }

  const category = await Category.create({
    userId,
    ...categoryData
  });

  return serializeDocument(category);
};

const listCategories = async (userId) => {
  const manualCategories = await Category.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });

  const transactions = await Transaction.findAll({
    where: { userId }
  });

  // Calculate aggregations per category in JS
  const categoryAggregates = {};
  transactions.forEach((tx) => {
    const catName = tx.category;
    if (!categoryAggregates[catName]) {
      categoryAggregates[catName] = {
        name: catName,
        totalAmount: 0,
        transactionCount: 0,
        expenseAmount: 0,
        incomeAmount: 0
      };
    }
    const amt = Number(tx.amount || 0);
    categoryAggregates[catName].totalAmount += amt;
    categoryAggregates[catName].transactionCount += 1;
    if (tx.type === 'expense') {
      categoryAggregates[catName].expenseAmount += amt;
    } else if (tx.type === 'income') {
      categoryAggregates[catName].incomeAmount += amt;
    }
  });

  const merged = new Map();

  manualCategories.forEach((catObj) => {
    const category = serializeDocument(catObj);
    merged.set(category.name.toLowerCase(), {
      ...category,
      source: 'manual'
    });
  });

  Object.values(categoryAggregates).forEach((category) => {
    const key = String(category.name || '').toLowerCase();
    const existing = merged.get(key);

    merged.set(key, {
      id: existing?.id,
      name: category.name,
      type: existing?.type || 'derived',
      color: existing?.color || '#718096',
      icon: existing?.icon || 'chart-bar',
      description: existing?.description || '',
      active: existing?.active !== undefined ? existing.active : true,
      source: existing?.source || 'transaction',
      spending: {
        totalAmount: roundToTwo(category.totalAmount),
        expenseAmount: roundToTwo(category.expenseAmount),
        incomeAmount: roundToTwo(category.incomeAmount),
        transactionCount: category.transactionCount
      }
    });
  });

  return serializeDocuments(Array.from(merged.values()));
};

const getCategoryById = async (userId, categoryId) => {
  const category = await Category.findOne({
    where: {
      id: categoryId,
      userId
    }
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return serializeDocument(category);
};

const updateCategory = async (userId, categoryId, payload) => {
  const category = await Category.findOne({
    where: {
      id: categoryId,
      userId
    }
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const update = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) {
      throw new AppError('Category name is required', 400);
    }
    update.name = name;
  }

  if (payload.type !== undefined) {
    update.type = String(payload.type).trim();
  }

  if (payload.color !== undefined) {
    update.color = String(payload.color).trim();
  }

  if (payload.icon !== undefined) {
    update.icon = String(payload.icon).trim();
  }

  if (payload.description !== undefined) {
    update.description = String(payload.description).trim();
  }

  if (payload.active !== undefined) {
    update.active = Boolean(payload.active);
  }

  await category.update(update);
  return serializeDocument(category);
};

const deleteCategory = async (userId, categoryId) => {
  const category = await Category.findOne({
    where: {
      id: categoryId,
      userId
    }
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const serialized = serializeDocument(category);
  await category.destroy();
  return serialized;
};

const getCategoryAnalytics = async (userId) => {
  const categories = await listCategories(userId);

  const totals = categories.reduce((accumulator, category) => {
    const spending = category.spending || {};
    const key = category.name;
    const existing = accumulator[key] || {
      category: key,
      transactionCount: 0,
      expenseAmount: 0,
      incomeAmount: 0
    };

    existing.transactionCount += Number(spending.transactionCount || 0);
    existing.expenseAmount += Number(spending.expenseAmount || 0);
    existing.incomeAmount += Number(spending.incomeAmount || 0);

    accumulator[key] = existing;
    return accumulator;
  }, {});

  return {
    categories,
    totals: Object.values(totals)
      .sort((left, right) => right.expenseAmount - left.expenseAmount)
      .map((entry) => ({
        ...entry,
        expenseAmount: roundToTwo(entry.expenseAmount),
        incomeAmount: roundToTwo(entry.incomeAmount)
      }))
  };
};

module.exports = {
  createCategory,
  deleteCategory,
  getCategoryAnalytics,
  getCategoryById,
  listCategories,
  updateCategory
};
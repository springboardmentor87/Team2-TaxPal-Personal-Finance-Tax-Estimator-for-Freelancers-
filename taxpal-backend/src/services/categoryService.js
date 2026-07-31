const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { getCollection } = require('./mongoService');
const { roundToTwo } = require('../utils/finance');
const { serializeDocument, serializeDocuments } = require('../utils/serialize');

const collectionName = 'categories';

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

const getCategoryCollection = () => getCollection(collectionName);

const createCategory = async (userId, payload) => {
  const category = normalizeCategoryInput(payload);
  const collection = getCategoryCollection();
  const now = new Date();

  const existing = await collection.findOne({
    userId,
    name: { $regex: `^${category.name}$`, $options: 'i' }
  });

  if (existing) {
    throw new AppError('Category already exists', 409);
  }

  const document = {
    userId,
    ...category,
    createdAt: now,
    updatedAt: now
  };

  const result = await collection.insertOne(document);
  return serializeDocument({ ...document, _id: result.insertedId });
};

const listCategories = async (userId) => {
  const collection = getCategoryCollection();
  const manualCategories = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  const transactionCategories = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        expenseAmount: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        incomeAmount: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        }
      }
    },
    { $sort: { expenseAmount: -1, transactionCount: -1 } }
  ]);

  const merged = new Map();

  manualCategories.forEach((category) => {
    merged.set(category.name.toLowerCase(), {
      ...serializeDocument(category),
      source: 'manual'
    });
  });

  transactionCategories.forEach((category) => {
    const key = String(category._id || '').toLowerCase();
    const existing = merged.get(key);

    merged.set(key, {
      id: existing?.id,
      name: category._id,
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
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID', 400);
  }

  const collection = getCategoryCollection();
  const category = await collection.findOne({ _id: new mongoose.Types.ObjectId(categoryId), userId });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return serializeDocument(category);
};

const updateCategory = async (userId, categoryId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID', 400);
  }

  const collection = getCategoryCollection();
  const existing = await collection.findOne({ _id: new mongoose.Types.ObjectId(categoryId), userId });

  if (!existing) {
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

  const result = await collection.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(categoryId), userId },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  return serializeDocument(result.value);
};

const deleteCategory = async (userId, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID', 400);
  }

  const collection = getCategoryCollection();
  const result = await collection.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId
  });

  if (!result.value) {
    throw new AppError('Category not found', 404);
  }

  return serializeDocument(result.value);
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
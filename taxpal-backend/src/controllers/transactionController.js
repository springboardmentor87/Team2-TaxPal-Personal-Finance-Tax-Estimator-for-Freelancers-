const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  createTransaction: createTransactionService,
  deleteTransaction: deleteTransactionService,
  getTransactionAnalytics,
  getTransactionById,
  listTransactions,
  updateTransaction: updateTransactionService
} = require('../services/transactionService');

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await createTransactionService(req.userId, req.body);
  return sendSuccess(res, 201, 'Transaction created successfully', transaction);
});

const getTransactions = asyncHandler(async (req, res) => {
  const data = await listTransactions(req.userId, req.query);
  return sendSuccess(res, 200, 'Transactions fetched successfully', data);
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await getTransactionById(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Transaction fetched successfully', transaction);
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await updateTransactionService(req.userId, req.params.id, req.body);
  return sendSuccess(res, 200, 'Transaction updated successfully', transaction);
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await deleteTransactionService(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Transaction deleted successfully', transaction);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getTransactionAnalytics(req.userId, req.query);
  return sendSuccess(res, 200, 'Transaction analytics fetched successfully', analytics);
});

module.exports = {
  createTransaction,
  deleteTransaction,
  getAnalytics,
  getTransaction,
  getTransactions,
  updateTransaction
};
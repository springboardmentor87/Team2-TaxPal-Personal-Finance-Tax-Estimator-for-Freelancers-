const Transaction = require('../models/Transaction');

const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date
    } = req.body;

    if (!type || amount === undefined || !category) {
      return res.status(400).json({
        message: 'Type, amount, and category are required'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        message: 'Type must be income or expense'
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0'
      });
    }

    const transaction = await Transaction.create({
      user: req.userId,
      type,
      amount: numericAmount,
      category: category.trim(),
      description: description?.trim() || '',
      date: date || new Date()
    });

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error(
      'Create transaction error:',
      error.message
    );

    return res.status(500).json({
      message: 'Server error while creating transaction'
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.userId
    }).sort({
      date: -1,
      createdAt: -1
    });

    return res.status(200).json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error(
      'Get transactions error:',
      error.message
    );

    return res.status(500).json({
      message: 'Server error while fetching transactions'
    });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error(
      'Delete transaction error:',
      error.message
    );

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid transaction ID'
      });
    }

    return res.status(500).json({
      message: 'Server error while deleting transaction'
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  deleteTransaction
};
const Transaction = require('../models/Transaction');


const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyTransactions = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    monthlyTransactions.forEach((t) => {
      if (t.type === 'income') monthlyIncome += t.amount;
      if (t.type === 'expense') monthlyExpenses += t.amount;
    });

    const savingsRate =
      monthlyIncome > 0
        ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1)
        : '0.0';

    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      summary: {
        monthlyIncome,
        monthlyExpenses,
        savingsRate: Number(savingsRate),
        month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
      },
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary };
const Expense = require('../models/Expense');
const { getMonthString } = require('../utils/helpers');

// @desc    Add expense
// @route   POST /api/expenses
// @access  Private (Admin only)
exports.addExpense = async (req, res) => {
  try {
    const { category, amount, date, description, receiptImage } = req.body;

    if (!category || !amount || !date || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, amount, date, and description',
      });
    }

    const month = getMonthString(date);

    // Check if month is locked
    const lockedExpense = await Expense.findOne({ month, isLocked: true });
    if (lockedExpense) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add expenses for a locked month',
      });
    }

    const expense = await Expense.create({
      category,
      amount,
      date,
      month,
      description,
      receiptImage: receiptImage || '',
      addedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: { expense },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { month, category } = req.query;

    let query = {};

    if (month) query.month = month;
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: { expenses },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin only)
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check if month is locked
    if (expense.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update expense from a locked month',
      });
    }

    const { category, amount, date, description, receiptImage } = req.body;

    if (category) expense.category = category;
    if (amount !== undefined) expense.amount = amount;
    if (date) {
      expense.date = date;
      expense.month = getMonthString(date);
    }
    if (description) expense.description = description;
    if (receiptImage !== undefined) expense.receiptImage = receiptImage;

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin only)
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check if month is locked
    if (expense.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete expense from a locked month',
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get month expenses
// @route   GET /api/expenses/month/:month
// @access  Private
exports.getMonthExpenses = async (req, res) => {
  try {
    const { month } = req.params;

    const expenses = await Expense.find({ month }).sort({ date: -1 });

    // Calculate total
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Group by category
    const categoryBreakdown = {
      grocery: 0,
      electricity: 0,
      gas: 0,
      water: 0,
      cleaning: 0,
      other: 0,
    };

    expenses.forEach((expense) => {
      categoryBreakdown[expense.category] += expense.amount;
    });

    res.status(200).json({
      success: true,
      month,
      total,
      data: {
        expenses,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Private
exports.getExpensesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { month } = req.query;

    let query = { category };
    if (month) query.month = month;

    const expenses = await Expense.find(query).sort({ date: -1 });

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.status(200).json({
      success: true,
      category,
      total,
      count: expenses.length,
      data: { expenses },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
exports.getExpenseSummary = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || getMonthString(new Date());

    const expenses = await Expense.find({ month: targetMonth });

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categoryBreakdown = {
      grocery: 0,
      electricity: 0,
      gas: 0,
      water: 0,
      cleaning: 0,
      other: 0,
    };

    expenses.forEach((expense) => {
      categoryBreakdown[expense.category] += expense.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        total,
        count: expenses.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

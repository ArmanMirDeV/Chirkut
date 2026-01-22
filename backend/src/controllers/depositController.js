const Deposit = require('../models/Deposit');
const User = require('../models/User');
const { getMonthString } = require('../utils/helpers');

// @desc    Add deposit
// @route   POST /api/deposits
// @access  Private (Admin only)
exports.addDeposit = async (req, res) => {
  try {
    const { userId, amount, date, paymentMethod, note } = req.body;

    if (!userId || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, amount, and date',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const month = getMonthString(date);

    // Check if month is locked
    const lockedDeposit = await Deposit.findOne({ month, isLocked: true });
    if (lockedDeposit) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add deposits for a locked month',
      });
    }

    const deposit = await Deposit.create({
      userId,
      userName: user.name,
      amount,
      date,
      month,
      paymentMethod: paymentMethod || 'cash',
      note: note || '',
      addedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Deposit added successfully',
      data: { deposit },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all deposits
// @route   GET /api/deposits
// @access  Private
exports.getDeposits = async (req, res) => {
  try {
    const { month, userId } = req.query;

    let query = {};

    // Regular users can only see their own deposits
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    } else if (userId) {
      query.userId = userId;
    }

    if (month) query.month = month;

    const deposits = await Deposit.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: deposits.length,
      data: { deposits },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user deposits
// @route   GET /api/deposits/user/:userId
// @access  Private
exports.getUserDeposits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.query;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these deposits',
      });
    }

    let query = { userId };
    if (month) query.month = month;

    const deposits = await Deposit.find(query).sort({ date: -1 });

    // Calculate total
    const total = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    res.status(200).json({
      success: true,
      count: deposits.length,
      total,
      data: { deposits },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get month deposits
// @route   GET /api/deposits/month/:month
// @access  Private (Admin only)
exports.getMonthDeposits = async (req, res) => {
  try {
    const { month } = req.params;

    const deposits = await Deposit.find({ month }).sort({ date: -1 });

    // Calculate total
    const total = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    // Group by user
    const userDeposits = {};
    deposits.forEach((deposit) => {
      if (!userDeposits[deposit.userId]) {
        userDeposits[deposit.userId] = {
          userId: deposit.userId,
          userName: deposit.userName,
          total: 0,
          deposits: [],
        };
      }
      userDeposits[deposit.userId].total += deposit.amount;
      userDeposits[deposit.userId].deposits.push(deposit);
    });

    res.status(200).json({
      success: true,
      month,
      total,
      data: {
        deposits,
        userDeposits: Object.values(userDeposits),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update deposit
// @route   PUT /api/deposits/:id
// @access  Private (Admin only)
exports.updateDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
    }

    // Check if month is locked
    if (deposit.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update deposit from a locked month',
      });
    }

    const { amount, date, paymentMethod, note } = req.body;

    if (amount !== undefined) deposit.amount = amount;
    if (date) {
      deposit.date = date;
      deposit.month = getMonthString(date);
    }
    if (paymentMethod) deposit.paymentMethod = paymentMethod;
    if (note !== undefined) deposit.note = note;

    await deposit.save();

    res.status(200).json({
      success: true,
      message: 'Deposit updated successfully',
      data: { deposit },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete deposit
// @route   DELETE /api/deposits/:id
// @access  Private (Admin only)
exports.deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
    }

    // Check if month is locked
    if (deposit.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete deposit from a locked month',
      });
    }

    await deposit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Deposit deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get deposit summary
// @route   GET /api/deposits/summary
// @access  Private
exports.getDepositSummary = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || getMonthString(new Date());

    let userId = req.user.id;
    if (req.user.role === 'admin' && req.query.userId) {
      userId = req.query.userId;
    }

    const deposits = await Deposit.find({ userId, month: targetMonth });

    const total = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        total,
        count: deposits.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

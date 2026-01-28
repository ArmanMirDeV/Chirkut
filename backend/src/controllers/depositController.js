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
      status: 'approved', // Admin adds are auto-approved
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

// @desc    Request deposit (User)
// @route   POST /api/deposits/request
// @access  Private
exports.requestDeposit = async (req, res) => {
  try {
    const { amount, date, paymentMethod, note } = req.body;

    if (!amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount and date',
      });
    }

    const month = getMonthString(date);

    // Check if month is locked
    const lockedDeposit = await Deposit.findOne({ month, isLocked: true });
    if (lockedDeposit) {
      return res.status(403).json({
        success: false,
        message: 'Cannot request deposits for a locked month',
      });
    }

    const deposit = await Deposit.create({
      userId: req.user.id,
      userName: req.user.name,
      amount,
      date,
      month,
      paymentMethod: paymentMethod || 'cash',
      note: note || '',
      addedBy: req.user.id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request sent to admin',
      data: { deposit },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve/Reject deposit (Admin)
// @route   PUT /api/deposits/:id/approve
// @access  Private (Admin only)
exports.approveDeposit = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid status (approved/rejected)',
      });
    }

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
    }

    if (deposit.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify deposit from a locked month',
      });
    }

    deposit.status = status;
    await deposit.save();

    res.status(200).json({
      success: true,
      message: `Deposit ${status} successfully`,
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

    // Calculate total only for approved deposits
    const total = deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, deposit) => sum + deposit.amount, 0);

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
// @access  Private
exports.getMonthDeposits = async (req, res) => {
  try {
    const { month } = req.params;

    // Fetch all active users first to ensure everyone is listed
    const activeUsers = await User.find({ isActive: true }).select('name _id');
    
    // Fetch all deposits for that month
    const deposits = await Deposit.find({ month }).sort({ date: -1 });

    // Calculate total confirmed
    const total = deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, deposit) => sum + deposit.amount, 0);

    // Group by user, starting with all active users at 0
    const userDeposits = {};
    activeUsers.forEach(u => {
      const id = u._id.toString();
      userDeposits[id] = {
        userId: id,
        userName: u.name,
        total: 0,
        deposits: [],
      };
    });

    // Add deposit data
    deposits.forEach((deposit) => {
      const uId = deposit.userId.toString();
      // Only include if user exists in our active list (or add them if they are inactive but have deposits)
      if (!userDeposits[uId]) {
        userDeposits[uId] = {
          userId: uId,
          userName: deposit.userName,
          total: 0,
          deposits: [],
        };
      }
      
      if (deposit.status === 'approved') {
        userDeposits[uId].total += deposit.amount;
      }
      userDeposits[uId].deposits.push(deposit);
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

    // Authorization: Admin/Manager can update any. User can only update their own PENDING requests.
    const isPowerUser = req.user.role === 'admin' || req.user.role === 'manager';
    if (!isPowerUser) {
      if (deposit.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this deposit',
        });
      }
      if (deposit.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Cannot update an already approved/rejected deposit',
        });
      }
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

    // Authorization: Admin/Manager can delete any. User can only delete their own PENDING requests.
    const isPowerUser = req.user.role === 'admin' || req.user.role === 'manager';
    if (!isPowerUser) {
      if (deposit.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this deposit',
        });
      }
      if (deposit.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete an already approved/rejected deposit',
        });
      }
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
    const isPowerUser = req.user.role === 'admin' || req.user.role === 'manager';
    if (isPowerUser && req.query.userId) {
      userId = req.query.userId;
    }

    const deposits = await Deposit.find({ userId, month: targetMonth, status: 'approved' });

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

const MonthlyReport = require('../models/MonthlyReport');
const Meal = require('../models/Meal');
const Deposit = require('../models/Deposit');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { getMonthString, getMonthName } = require('../utils/helpers');

// @desc    Close month and generate report
// @route   POST /api/reports/close-month
// @access  Private (Admin only)
exports.closeMonth = async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month (YYYY-MM format)',
      });
    }

    // Check if month is already closed
    const existingReport = await MonthlyReport.findOne({ month });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'This month has already been closed',
      });
    }

    // Get all active users
    const users = await User.find({ isActive: true });

    // Get all meals for the month
    const meals = await Meal.find({ month });

    // Get all expenses for the month
    const expenses = await Expense.find({ month });

    // Get all deposits for the month
    const deposits = await Deposit.find({ month });

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (totalExpenses === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot close month with zero expenses',
      });
    }

    // Calculate expense breakdown by category
    const expenseBreakdown = {
      grocery: 0,
      electricity: 0,
      gas: 0,
      water: 0,
      cleaning: 0,
      other: 0,
    };

    expenses.forEach((expense) => {
      expenseBreakdown[expense.category] += expense.amount;
    });

    // Calculate total meals
    let totalMeals = 0;
    const userMealCounts = {};

    meals.forEach((meal) => {
      const userId = meal.userId.toString();

      if (!userMealCounts[userId]) {
        userMealCounts[userId] = {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          guestMeals: 0,
        };
      }

      if (meal.mealType === 'breakfast') userMealCounts[userId].breakfast++;
      if (meal.mealType === 'lunch') userMealCounts[userId].lunch++;
      if (meal.mealType === 'dinner') userMealCounts[userId].dinner++;
      userMealCounts[userId].guestMeals += meal.guestCount;

      totalMeals += 1 + meal.guestCount;
    });

    if (totalMeals === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot close month with zero meals',
      });
    }

    // Calculate cost per meal
    const costPerMeal = totalExpenses / totalMeals;

    // Calculate user deposits
    const userDepositTotals = {};
    deposits.forEach((deposit) => {
      const userId = deposit.userId.toString();
      if (!userDepositTotals[userId]) {
        userDepositTotals[userId] = 0;
      }
      userDepositTotals[userId] += deposit.amount;
    });

    // Generate user reports
    const userReports = [];

    for (const user of users) {
      const userId = user._id.toString();
      const mealCounts = userMealCounts[userId] || {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        guestMeals: 0,
      };

      const totalUserMeals =
        mealCounts.breakfast +
        mealCounts.lunch +
        mealCounts.dinner +
        mealCounts.guestMeals;

      const amountDue = totalUserMeals * costPerMeal;
      const totalDeposits = userDepositTotals[userId] || 0;
      const balance = amountDue - totalDeposits;

      userReports.push({
        userId: user._id,
        userName: user.name,
        breakfastCount: mealCounts.breakfast,
        lunchCount: mealCounts.lunch,
        dinnerCount: mealCounts.dinner,
        guestMeals: mealCounts.guestMeals,
        totalMeals: totalUserMeals,
        amountDue: Math.round(amountDue * 100) / 100,
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    // Create monthly report
    const [year, monthNum] = month.split('-');
    const monthName = getMonthName(month);

    const report = await MonthlyReport.create({
      month,
      year: parseInt(year),
      monthName,
      totalMeals,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      costPerMeal: Math.round(costPerMeal * 100) / 100,
      expenseBreakdown,
      userReports,
      closedAt: new Date(),
      closedBy: req.user.id,
      isLocked: true,
    });

    // Lock all meals, deposits, and expenses for this month
    await Meal.updateMany({ month }, { $set: { isLocked: true } });
    await Deposit.updateMany({ month }, { $set: { isLocked: true } });
    await Expense.updateMany({ month }, { $set: { isLocked: true } });

    res.status(201).json({
      success: true,
      message: `Month ${monthName} ${year} closed successfully`,
      data: { report },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all monthly reports
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    const reports = await MonthlyReport.find().sort({ month: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: { reports },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get specific month report
// @route   GET /api/reports/:month
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const { month } = req.params;

    const report = await MonthlyReport.findOne({ month });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found for this month',
      });
    }

    // If regular user, filter to show only their data
    if (req.user.role !== 'admin') {
      const userReport = report.userReports.find(
        (ur) => ur.userId.toString() === req.user.id
      );

      return res.status(200).json({
        success: true,
        data: {
          report: {
            month: report.month,
            year: report.year,
            monthName: report.monthName,
            totalMeals: report.totalMeals,
            totalExpenses: report.totalExpenses,
            costPerMeal: report.costPerMeal,
            expenseBreakdown: report.expenseBreakdown,
            userReport: userReport || null,
            closedAt: report.closedAt,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { report },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's report history
// @route   GET /api/reports/user/:userId
// @access  Private
exports.getUserReportHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these reports',
      });
    }

    const reports = await MonthlyReport.find().sort({ month: -1 });

    // Filter user's data from each report
    const userHistory = reports.map((report) => {
      const userReport = report.userReports.find(
        (ur) => ur.userId.toString() === userId
      );

      return {
        month: report.month,
        year: report.year,
        monthName: report.monthName,
        costPerMeal: report.costPerMeal,
        userReport: userReport || null,
        closedAt: report.closedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: userHistory.length,
      data: { history: userHistory },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Check if month is closed
// @route   GET /api/reports/status/:month
// @access  Private
exports.getMonthStatus = async (req, res) => {
  try {
    const { month } = req.params;

    const report = await MonthlyReport.findOne({ month });

    res.status(200).json({
      success: true,
      data: {
        month,
        isClosed: !!report,
        closedAt: report ? report.closedAt : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Validate month before closing
// @route   POST /api/reports/validate
// @access  Private (Admin only)
exports.validateMonth = async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month (YYYY-MM format)',
      });
    }

    // Check if already closed
    const existingReport = await MonthlyReport.findOne({ month });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Month already closed',
      });
    }

    // Get counts
    const mealCount = await Meal.countDocuments({ month });
    const expenseCount = await Expense.countDocuments({ month });
    const depositCount = await Deposit.countDocuments({ month });

    // Calculate totals
    const expenses = await Expense.find({ month });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const deposits = await Deposit.find({ month });
    const totalDeposits = deposits.reduce((sum, dep) => sum + dep.amount, 0);

    const meals = await Meal.find({ month });
    const totalMeals = meals.reduce(
      (sum, meal) => sum + 1 + meal.guestCount,
      0
    );

    const warnings = [];
    const errors = [];

    if (mealCount === 0) {
      errors.push('No meals recorded for this month');
    }

    if (expenseCount === 0) {
      errors.push('No expenses recorded for this month');
    }

    if (totalExpenses === 0) {
      errors.push('Total expenses is zero');
    }

    if (depositCount === 0) {
      warnings.push('No deposits recorded for this month');
    }

    const valid = errors.length === 0;

    res.status(200).json({
      success: true,
      data: {
        month,
        valid,
        stats: {
          mealCount,
          totalMeals,
          expenseCount,
          totalExpenses,
          depositCount,
          totalDeposits,
        },
        warnings,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

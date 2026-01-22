const Meal = require('../models/Meal');
const { getMonthString } = require('../utils/helpers');

// @desc    Add meal entry
// @route   POST /api/meals
// @access  Private
exports.addMeal = async (req, res) => {
  try {
    const { date, mealType, guestCount = 0 } = req.body;

    if (!date || !mealType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and meal type',
      });
    }

    const month = getMonthString(date);

    // Check if month is locked
    const existingMeal = await Meal.findOne({ month, isLocked: true });
    if (existingMeal) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add meals for a locked month',
      });
    }

    // Check if meal already exists for this user, date, and meal type
    const mealExists = await Meal.findOne({
      userId: req.user.id,
      date: new Date(date),
      mealType,
    });

    if (mealExists) {
      return res.status(400).json({
        success: false,
        message: `You have already added ${mealType} for this date`,
      });
    }

    const meal = await Meal.create({
      userId: req.user.id,
      userName: req.user.name,
      date,
      mealType,
      guestCount,
      month,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Meal added successfully',
      data: { meal },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get meals
// @route   GET /api/meals
// @access  Private
exports.getMeals = async (req, res) => {
  try {
    const { userId, month, date, mealType } = req.query;

    let query = {};

    // Regular users can only see their own meals
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    } else if (userId) {
      query.userId = userId;
    }

    if (month) query.month = month;
    if (date) query.date = new Date(date);
    if (mealType) query.mealType = mealType;

    const meals = await Meal.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: meals.length,
      data: { meals },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single meal
// @route   GET /api/meals/:id
// @access  Private
exports.getMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    // Check if user owns the meal or is admin
    if (meal.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this meal',
      });
    }

    res.status(200).json({
      success: true,
      data: { meal },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private (Admin only)
exports.updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    // Check if month is locked
    if (meal.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update meal from a locked month',
      });
    }

    const { date, mealType, guestCount } = req.body;

    if (date) {
      meal.date = date;
      meal.month = getMonthString(date);
    }
    if (mealType) meal.mealType = mealType;
    if (guestCount !== undefined) meal.guestCount = guestCount;

    meal.updatedBy = req.user.id;

    await meal.save();

    res.status(200).json({
      success: true,
      message: 'Meal updated successfully',
      data: { meal },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private (Admin only)
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    // Check if month is locked
    if (meal.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete meal from a locked month',
      });
    }

    await meal.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get monthly meal stats
// @route   GET /api/meals/stats/monthly
// @access  Private
exports.getMonthlyStats = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || getMonthString(new Date());

    let userId = req.user.id;
    if (req.user.role === 'admin' && req.query.userId) {
      userId = req.query.userId;
    }

    const meals = await Meal.find({ userId, month: targetMonth });

    const stats = {
      month: targetMonth,
      breakfast: meals.filter((m) => m.mealType === 'breakfast').length,
      lunch: meals.filter((m) => m.mealType === 'lunch').length,
      dinner: meals.filter((m) => m.mealType === 'dinner').length,
      guestMeals: meals.reduce((sum, m) => sum + m.guestCount, 0),
    };

    stats.total = stats.breakfast + stats.lunch + stats.dinner + stats.guestMeals;

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get today's meals
// @route   GET /api/meals/today
// @access  Private
exports.getTodayMeals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await Meal.find({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    });

    res.status(200).json({
      success: true,
      data: { meals },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

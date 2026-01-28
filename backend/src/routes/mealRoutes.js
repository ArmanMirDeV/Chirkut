const express = require('express');
const {
  addMeal,
  getMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  getMonthlyStats,
  getTodayMeals,
  getDailyMealSummary,
} = require('../controllers/mealController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, addMeal);
router.get('/', protect, getMeals);
router.get('/stats/monthly', protect, getMonthlyStats);
router.get('/today', protect, getTodayMeals);
router.get('/summary/daily', protect, getDailyMealSummary);
router.get('/:id', protect, getMeal);
router.put('/:id', protect, adminOnly, updateMeal);
router.delete('/:id', protect, adminOnly, deleteMeal);


module.exports = router;

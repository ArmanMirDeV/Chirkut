const express = require('express');
const {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getMonthExpenses,
  getExpensesByCategory,
  getExpenseSummary,
} = require('../controllers/expenseController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, adminOnly, addExpense);
router.get('/', protect, getExpenses);
router.get('/summary', protect, getExpenseSummary);
router.get('/month/:month', protect, getMonthExpenses);
router.get('/category/:category', protect, getExpensesByCategory);
router.get('/:id', protect, getExpense);
router.put('/:id', protect, adminOnly, updateExpense);
router.delete('/:id', protect, adminOnly, deleteExpense);

module.exports = router;

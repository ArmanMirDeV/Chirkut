const express = require('express');
const {
  addDeposit,
  getDeposits,
  getUserDeposits,
  getMonthDeposits,
  updateDeposit,
  deleteDeposit,
  getDepositSummary,
} = require('../controllers/depositController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, adminOnly, addDeposit);
router.get('/', protect, getDeposits);
router.get('/summary', protect, getDepositSummary);
router.get('/user/:userId', protect, getUserDeposits);
router.get('/month/:month', protect, adminOnly, getMonthDeposits);
router.put('/:id', protect, adminOnly, updateDeposit);
router.delete('/:id', protect, adminOnly, deleteDeposit);

module.exports = router;

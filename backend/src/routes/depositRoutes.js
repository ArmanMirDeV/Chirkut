const express = require('express');
const {
  addDeposit,
  getDeposits,
  getUserDeposits,
  getMonthDeposits,
  updateDeposit,
  deleteDeposit,
  getDepositSummary,
  requestDeposit,
  approveDeposit,
} = require('../controllers/depositController');

const { protect, adminOnly, managerOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, managerOnly, addDeposit);
router.post('/request', protect, requestDeposit);
router.get('/', protect, getDeposits);
router.get('/summary', protect, getDepositSummary);
router.get('/user/:userId', protect, getUserDeposits);
router.get('/month/:month', protect, getMonthDeposits);


router.put('/:id', protect, updateDeposit);
router.put('/:id/approve', protect, managerOnly, approveDeposit);
router.delete('/:id', protect, managerOnly, deleteDeposit);




module.exports = router;

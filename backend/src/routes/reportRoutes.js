const express = require('express');
const {
  closeMonth,
  getReports,
  getReport,
  getUserReportHistory,
  getMonthStatus,
  validateMonth,
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/close-month', protect, adminOnly, closeMonth);
router.post('/validate', protect, adminOnly, validateMonth);
router.get('/', protect, getReports);
router.get('/status/:month', protect, getMonthStatus);
router.get('/user/:userId', protect, getUserReportHistory);
router.get('/:month', protect, getReport);

module.exports = router;

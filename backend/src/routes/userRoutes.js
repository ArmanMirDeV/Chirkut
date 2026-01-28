const express = require('express');
const {
  getAllUsers,
  getActiveUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  applyForManager,
  updateManagerStatus,
} = require('../controllers/userController');

const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getAllUsers);
router.get('/active', protect, getActiveUsers);
router.get('/:id', protect, getUserById);
router.post('/apply-manager', protect, applyForManager);
router.put('/profile/me', protect, updateProfile);

router.put('/:id', protect, adminOnly, updateUser);
router.put('/:id/manager-status', protect, adminOnly, updateManagerStatus);
router.delete('/:id', protect, adminOnly, deleteUser);


module.exports = router;

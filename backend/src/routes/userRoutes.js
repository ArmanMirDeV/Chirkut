const express = require('express');
const {
  getAllUsers,
  getActiveUsers,
  getUserById,
  updateUser,
  deactivateUser,
  updateProfile,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getAllUsers);
router.get('/active', protect, getActiveUsers);
router.get('/:id', protect, getUserById);
router.put('/profile/me', protect, updateProfile);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deactivateUser);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

module.exports = router;
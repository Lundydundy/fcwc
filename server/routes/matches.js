const express = require('express');
const {
  getMatches,
  getMatch,
  getMatchesByGroup,
  getMatchesByDate,
  createMatch,
  updateMatch
} = require('../controllers/matchController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Routes
router.route('/')
  .get(getMatches)
  .post(protect, authorize('admin'), createMatch);

router.route('/:id')
  .get(getMatch)
  .put(protect, authorize('admin'), updateMatch);

router.route('/group/:group')
  .get(getMatchesByGroup);

router.route('/date/:date')
  .get(getMatchesByDate);

module.exports = router;
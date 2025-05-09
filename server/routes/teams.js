const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getTeam,
  createTeam,
  updateTeam,
  addPlayers,
  updatePlayerRole,
  updatePlayerRoles,
  getAvailablePlayers,
  resetTeam,
  transferPlayers
} = require('../controllers/teamController');

const router = express.Router();

// Get user's team and create team
router.route('/')
  .get(protect, getTeam)
  .post(protect, createTeam)
  .put(protect, updateTeam)
  .delete(protect, resetTeam);

// Player management
router.route('/players')
  .post(protect, addPlayers)
  .put(protect, updatePlayerRoles);

router.route('/players/:playerId')
  .put(protect, updatePlayerRole);

// Get available players for selection
router.route('/available-players')
  .get(protect, getAvailablePlayers);

// Handle transfers
router.route('/transfers')
  .post(protect, transferPlayers);

module.exports = router;
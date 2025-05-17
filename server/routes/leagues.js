const express = require('express');
const { protect } = require('../middleware/auth');
const League = require('../models/League');
const router = express.Router();

// @route   GET /api/leagues
// @desc    Get leagues that user belongs to
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const leagues = await League.find({
      'members.user': req.user.id
    }).populate('owner', 'name email');
    
    res.status(200).json({
      success: true,
      count: leagues.length,
      data: leagues
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   POST /api/leagues
// @desc    Create a new league
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    // Find the user's team if it exists
    const Team = require('../models/Team');
    const userTeam = await Team.findOne({ user: req.user.id });
    
    // Prepare members array with the creator (and their team if it exists)
    const memberData = userTeam 
      ? { user: req.user.id, team: userTeam._id, joinedAt: Date.now() }
      : { user: req.user.id, joinedAt: Date.now() };
    
    // Create league with member data
    const league = await League.create({
      ...req.body,
      owner: req.user.id,
      members: [memberData]
    });
    
    res.status(201).json({
      success: true,
      data: league
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET /api/leagues/public
// @desc    Get public leagues
// @access  Private
router.get('/public', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { type: 'public' };
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const leagues = await League.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name');
      
    const total = await League.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: leagues.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: leagues
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET /api/leagues/all-public
// @desc    Get all public leagues (no auth required)
// @access  Public
router.get('/all-public', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    let query = { type: 'public' };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const leagues = await League.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name');
    const total = await League.countDocuments(query);
    res.status(200).json({
      success: true,
      count: leagues.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: leagues
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET /api/leagues/:id
// @desc    Get single league by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name')
      .populate('members.team', 'name totalPoints');
      
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: league
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   POST /api/leagues/join
// @desc    Join a league with an invite code
// @access  Private
router.post('/join', protect, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an invite code'
      });
    }
    
    // Find the league with the invite code
    const league = await League.findOne({ inviteCode });
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }
    
    // Check if the user is already a member
    const isMember = league.members.some(member => 
      member.user.toString() === req.user.id
    );
    
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this league'
      });
    }
    
    // Check if league is full
    if (league.members.length >= league.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This league is full'
      });
    }    // Find the user's team if it exists
    const Team = require('../models/Team');
    const userTeam = await Team.findOne({ user: req.user.id });
    
    // Add user to league members (with team if exists)
    const memberData = userTeam 
      ? { user: req.user.id, team: userTeam._id, joinedAt: Date.now() }
      : { user: req.user.id, joinedAt: Date.now() };
      
    league.members.push(memberData);
    await league.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully joined league',
      data: league
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   POST /api/leagues/:id/join-public
// @desc    Join a public league by ID (for public leagues only)
// @access  Private
router.post('/:id/join-public', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (league.type !== 'public') {
      return res.status(400).json({ success: false, message: 'This league is not public' });
    }
    // Check if the user is already a member
    const isMember = league.members.some(member =>
      (member.user && member.user.toString()) === req.user.id
    );
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this league' });
    }
    // Add user to members
    const Team = require('../models/Team');
    const userTeam = await Team.findOne({ user: req.user.id });
    const memberData = userTeam
      ? { user: req.user.id, team: userTeam._id, joinedAt: Date.now() }
      : { user: req.user.id, joinedAt: Date.now() };
    league.members.push(memberData);
    await league.save();
    res.status(200).json({ success: true, message: 'Joined public league successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// @route   DELETE /api/leagues/:id
// @desc    Delete a league (owner only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }
    
    // Make sure user is league owner
    if (league.owner.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this league'
      });
    }
    
    await league.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });  }
});

// @route   PUT /api/leagues/update-team
// @desc    Update user's team in all leagues after team creation/update
// @access  Private
router.put('/update-team', protect, async (req, res) => {
  try {
    // Find the user's team
    const Team = require('../models/Team');
    const userTeam = await Team.findOne({ user: req.user.id });
    
    if (!userTeam) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    // Find all leagues where the user is a member
    const leagues = await League.find({ 'members.user': req.user.id });
    
    if (leagues.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'User is not a member of any league',
        updatedCount: 0
      });
    }
    
    // Update each league with the team information
    let updatedCount = 0;
    for (const league of leagues) {
      const memberIndex = league.members.findIndex(
        member => member.user.toString() === req.user.id
      );
      
      if (memberIndex !== -1) {
        league.members[memberIndex].team = userTeam._id;
        await league.save();
        updatedCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Team updated in ${updatedCount} league(s)`,
      updatedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   DELETE /api/leagues/:id/leave
// @desc    Leave a league
// @access  Private
router.delete('/:id/leave', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }
    
    // Check if user is a member of the league
    const memberIndex = league.members.findIndex(
      member => member.user.toString() === req.user.id
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this league'
      });
    }
    
    // Check if user is the owner
    if (league.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'League owner cannot leave. Transfer ownership or delete the league instead.'
      });
    }
    
    // Remove user from members array
    league.members.splice(memberIndex, 1);
    await league.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully left the league'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

module.exports = router;
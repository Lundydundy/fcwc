const express = require('express');
const { protect } = require('../middleware/auth');
const Player = require('../models/Player');
const router = express.Router();

// @route   GET /api/players
// @desc    Get all players with filtering, sorting and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { position, club, minPrice, maxPrice, search, sort, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by position
    if (position) {
      query.position = position;
    }
    
    // Filter by club
    if (club) {
      query.club = club;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Sorting
    let sortOptions = {};
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      });
    } else {
      // Default sort by total points descending
      sortOptions = { totalPoints: -1 };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const players = await Player.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Player.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: players.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: players
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET /api/players/:id
// @desc    Get single player by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: player
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Admin only routes (for development/seeding purposes)

// @route   POST /api/players
// @desc    Add a player
// @access  Private/Admin (to be implemented)
router.post('/', protect, async (req, res) => {
  try {
    // In production, this would check for admin permissions
    const player = await Player.create(req.body);
    
    res.status(201).json({
      success: true,
      data: player
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   PUT /api/players/:id
// @desc    Update player
// @access  Private/Admin (to be implemented)
router.put('/:id', protect, async (req, res) => {
  try {
    // In production, this would check for admin permissions
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: player
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
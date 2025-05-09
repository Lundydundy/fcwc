const Match = require('../models/Match');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort('date time');

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get matches by group
// @route   GET /api/matches/group/:group
// @access  Public
exports.getMatchesByGroup = async (req, res) => {
  try {
    const matches = await Match.find({ group: req.params.group }).sort('date time');

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get matches by date
// @route   GET /api/matches/date/:date
// @access  Public
exports.getMatchesByDate = async (req, res) => {
  try {
    const dateString = req.params.date; // Format should be YYYY-MM-DD
    
    // Create start and end dates for the requested day
    const startDate = new Date(dateString);
    const endDate = new Date(dateString);
    endDate.setDate(endDate.getDate() + 1);
    
    const matches = await Match.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort('time');

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get match by ID
// @route   GET /api/matches/:id
// @access  Public
exports.getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Create a match
// @route   POST /api/matches
// @access  Private (Admin only)
exports.createMatch = async (req, res) => {
  try {
    const match = await Match.create(req.body);

    res.status(201).json({
      success: true,
      data: match
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update match result
// @route   PUT /api/matches/:id
// @access  Private (Admin only)
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};
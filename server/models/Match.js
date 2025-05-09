const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  homeTeam: {
    type: String,
    required: [true, 'Please add home team name'],
    trim: true
  },
  awayTeam: {
    type: String,
    required: [true, 'Please add away team name'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add match date']
  },
  time: {
    type: String,
    required: [true, 'Please add match time']
  },
  stage: {
    type: String,
    required: [true, 'Please add match stage'],
    default: 'First stage'
  },
  group: {
    type: String,
    required: [true, 'Please add match group']
  },
  homeScore: {
    type: Number,
    default: null
  },
  awayScore: {
    type: Number,
    default: null
  },
  played: {
    type: Boolean,
    default: false
  },
  venue: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual 'id' property
MatchSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Match', MatchSchema);
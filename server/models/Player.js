const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add player name'],
    trim: true
  },
  club: {
    type: String,
    required: [true, 'Please add player club'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Please specify player position'],
    enum: ['GK', 'DEF', 'MID', 'FWD']
  },
  price: {
    type: Number,
    required: [true, 'Please add player price']
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  form: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  pointsHistory: [
    {
      gameweek: Number,
      points: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  stats: {
    goals: {
      type: Number,
      default: 0
    },
    assists: {
      type: Number,
      default: 0
    },
    cleanSheets: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    yellowCards: {
      type: Number,
      default: 0
    },
    redCards: {
      type: Number,
      default: 0
    },
    minutesPlayed: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual 'id' property
PlayerSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Player', PlayerSchema);
const mongoose = require('mongoose');

// Helper function to validate team formation
const validateFormation = (players, formation) => {
  // Filter out bench players to get starting 11
  const startingPlayers = players.filter(player => !player.isOnBench);
  
  // Count positions in starting 11
  const positionCounts = {
    GK: startingPlayers.filter(p => p.position === 'GK').length,
    DEF: startingPlayers.filter(p => p.position === 'DEF').length,
    MID: startingPlayers.filter(p => p.position === 'MID').length,
    FWD: startingPlayers.filter(p => p.position === 'FWD').length
  };
  
  // Parse formation (e.g., '4-4-2' means 4 DEF, 4 MID, 2 FWD)
  const [def, mid, fwd] = formation.split('-').map(Number);
  
  // Validate counts
  if (positionCounts.GK !== 1) return 'Team must have exactly 1 starting goalkeeper';
  if (positionCounts.DEF !== def) return `Formation ${formation} requires ${def} defenders, but found ${positionCounts.DEF}`;
  if (positionCounts.MID !== mid) return `Formation ${formation} requires ${mid} midfielders, but found ${positionCounts.MID}`;
  if (positionCounts.FWD !== fwd) return `Formation ${formation} requires ${fwd} forwards, but found ${positionCounts.FWD}`;
  
  return null; // No error
};

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  budget: {
    type: Number,
    default: 100.0  // Default budget in millions
  },
  players: [
    {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      position: {
        type: String,
        enum: ['GK', 'DEF', 'MID', 'FWD']
      },
      isOnBench: {
        type: Boolean,
        default: false
      },
      isCaptain: {
        type: Boolean,
        default: false
      },
      isViceCaptain: {
        type: Boolean,
        default: false
      }
    }
  ],
  formation: {
    type: String,
    enum: ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '3-4-3'],
    default: '4-4-2'
  },
  totalPoints: {
    type: Number,
    default: 0
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
TeamSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Prevent user from creating more than one team, but allow multiple teams with null user
TeamSchema.index({ user: 1 }, { unique: true, sparse: true });

// Validator to ensure team has exactly 14 players with 11 starters and 3 bench players
TeamSchema.pre('save', async function(next) {
  if (this.players && this.players.length > 0) {
    // Check total number of players
    if (this.players.length !== 15) {
      return next(new Error('Team must have exactly 15 players'));
    }
    
    // Check bench players
    const benchPlayers = this.players.filter(player => player.isOnBench);
    if (benchPlayers.length !== 4) {
      return next(new Error('Team must have exactly 4 bench players'));
    }
    
    // Check positions
    const goalkeepers = this.players.filter(player => player.position === 'GK');
    if (goalkeepers.length < 1) {
      return next(new Error('Team must have at least 1 goalkeeper'));
    }

    // Ensure only one captain
    const captains = this.players.filter(player => player.isCaptain);
    if (captains.length > 1) {
      return next(new Error('Team can have only one captain'));
    }

    // Ensure only one vice-captain
    const viceCaptains = this.players.filter(player => player.isViceCaptain);
    if (viceCaptains.length > 1) {
      return next(new Error('Team can have only one vice-captain'));
    }

    // Ensure captain and vice-captain aren't the same player
    const isSamePlayer = this.players.some(player => player.isCaptain && player.isViceCaptain);
    if (isSamePlayer) {
      return next(new Error('Captain and vice-captain must be different players'));
    }
    
    // Validate formation
    // const formationError = validateFormation(this.players, this.formation);
    // if (formationError) {
    //   return next(new Error(formationError));
    // }
  }
  next();
});

module.exports = mongoose.model('Team', TeamSchema);
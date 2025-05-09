const mongoose = require('mongoose');
const crypto = require('crypto');

const LeagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add league name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  inviteCode: {
    type: String,
    unique: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  maxMembers: {
    type: Number,
    default: 20
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
LeagueSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Generate invite code before saving
LeagueSchema.pre('save', function(next) {
  // Only generate code if it's a new league or the type has changed to private
  if (!this.isModified('type') && this.inviteCode) {
    return next();
  }
  
  if (this.type === 'private') {
    // Generate a random 8-character invite code
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  } else {
    this.inviteCode = undefined;
  }
  
  next();
});

module.exports = mongoose.model('League', LeagueSchema);
const Team = require('../models/Team');
const Player = require('../models/Player');
const mongoose = require('mongoose');
const { console } = require('inspector');

// @desc    Get user's team
// @route   GET /api/teams
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ user: req.user.id })
      .populate('players.player');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    // Check if user already has a team
    const existingTeam = await Team.findOne({ user: req.user.id });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'User already has a team'
      });
    }

    // Extract team data from request
    const { name, players, formation } = req.body;

    // Create basic team first
    const team = await Team.create({
      name,
      formation: formation || '4-4-2',
      user: req.user.id,
      players: []  // Start with empty players array
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update team details (name, formation)
// @route   PUT /api/teams
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    const { name, formation } = req.body;
    
    let team = await Team.findOne({ user: req.user.id });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }

    // Update only name and formation
    team = await Team.findOneAndUpdate(
      { user: req.user.id },
      { name, formation },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Add players to team
// @route   POST /api/teams/players
// @access  Private
exports.addPlayers = async (req, res) => {
  try {
    const { players } = req.body;
    
    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of players'
      });
    }
    
    let team = await Team.findOne({ user: req.user.id }).populate('players.player');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    // Verify player IDs exist in database
    const playerIds = players.map(p => p.player);
    const existingPlayers = await Player.find({ _id: { $in: playerIds } });
    
    if (existingPlayers.length !== playerIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more player IDs are invalid'
      });
    }

    // Check for duplicate players
    const existingPlayerIds = team.players.map(p => p.player._id.toString());
    const duplicates = playerIds.filter(id => existingPlayerIds.includes(id.toString()));
    
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more players are already in the team'
      });
    }
    
    // Calculate total cost of players
    let totalCost = 0;
    for (const playerId of playerIds) {
      const player = await Player.findById(playerId);
      totalCost += player.price;
    }
    
    // Check if budget allows this purchase
    const remainingBudget = team.budget - totalCost;
    console.log('Remaining Budget:', remainingBudget);
    if (remainingBudget < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient budget for these players'
      });
    }

    // Create new player entries with position data
    const playersToAdd = [];
    for (const playerInfo of players) {
      const player = await Player.findById(playerInfo.player);
      playersToAdd.push({
        player: playerInfo.player,
        position: player.position, // Set position from player's data
        isOnBench: playerInfo.isOnBench || false,
        isCaptain: playerInfo.isCaptain || false,
        isViceCaptain: playerInfo.isViceCaptain || false
      });
    }
    
    // Check if adding these players would violate formation constraints
    const updatedPlayers = [...team.players, ...playersToAdd];
    
    // Simulate formation validation
    if (updatedPlayers.length === 14) { // Only validate if we have a full team
      // Filter out bench players to get starting 11
      const startingPlayers = updatedPlayers.filter(player => !player.isOnBench);
      
      if (startingPlayers.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'Team must have exactly 11 starting players'
        });
      }
      
      // Count positions in starting 11
      const positionCounts = {
        GK: startingPlayers.filter(p => p.position === 'GK').length,
        DEF: startingPlayers.filter(p => p.position === 'DEF').length,
        MID: startingPlayers.filter(p => p.position === 'MID').length,
        FWD: startingPlayers.filter(p => p.position === 'FWD').length
      };
      
      // Parse formation (e.g., '4-4-2' means 4 DEF, 4 MID, 2 FWD)
      const [def, mid, fwd] = team.formation.split('-').map(Number);
      
      // Validate counts
      if (positionCounts.GK !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Team must have exactly 1 starting goalkeeper'
        });
      }
      if (positionCounts.DEF !== def) {
        return res.status(400).json({
          success: false,
          message: `Formation ${team.formation} requires ${def} defenders, but found ${positionCounts.DEF}`
        });
      }
      if (positionCounts.MID !== mid) {
        return res.status(400).json({
          success: false,
          message: `Formation ${team.formation} requires ${mid} midfielders, but found ${positionCounts.MID}`
        });
      }
      if (positionCounts.FWD !== fwd) {
        return res.status(400).json({
          success: false,
          message: `Formation ${team.formation} requires ${fwd} forwards, but found ${positionCounts.FWD}`
        });
      }
    }
    
    // Update team with new players and budget
    team = await Team.findOneAndUpdate(
      { user: req.user.id },
      { 
        $push: { players: { $each: playersToAdd } },
        $set: { budget: remainingBudget }
      },
      { new: true, runValidators: true }
    ).populate('players.player');
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update player roles (bench, captain, vice-captain)
// @route   PUT /api/teams/players/:playerId
// @access  Private
exports.updatePlayerRole = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { isOnBench, isCaptain, isViceCaptain } = req.body;
    
    // Skip validation if we need to, to handle more flexible ID formats
    // This is a safety measure for non-standard MongoDB ObjectIDs
    let skipValidation = false;
    
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      console.log('Warning: Non-standard ID format received:', playerId);
      skipValidation = true;
    }
    
    const team = await Team.findOne({ user: req.user.id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    // Enhanced player finding logic for more flexibility
    let playerIndex = -1;
    
    // Try multiple ways to find the player in the team
    
    // 1. Direct _id match (team player entry id)
    playerIndex = team.players.findIndex(p => 
      p._id && p._id.toString() === playerId
    );
    
    // 2. Player reference id match (MongoDB ObjectId reference)
    if (playerIndex === -1) {
      playerIndex = team.players.findIndex(p => 
        p.player && p.player.toString() === playerId
      );
    }
    
    // 3. If we have a populated player object with id
    if (playerIndex === -1) {
      playerIndex = team.players.findIndex(p => 
        typeof p.player === 'object' && 
        p.player !== null && 
        p.player._id && 
        p.player._id.toString() === playerId
      );
    }
    
    // 4. For non-standard ID formats, try string comparison
    if (playerIndex === -1 && skipValidation) {
      playerIndex = team.players.findIndex(p => {
        // String ID comparison
        if (typeof p.player === 'string') {
          return p.player === playerId;
        }
        
        // Object with id property
        if (typeof p.player === 'object' && p.player !== null && p.player.id) {
          return p.player.id === playerId;
        }
        
        return false;
      });
    }
    
    if (playerIndex === -1) {
      // Log debugging info to help track down issues
      console.log('Player not found. Requested ID:', playerId);
      console.log('Team ID:', team._id);
      console.log('Available players:', JSON.stringify(team.players.map(p => ({
        _id: p._id ? p._id.toString() : null,
        player_id: p.player ? (
          typeof p.player === 'object' ? p.player._id : p.player.toString()
        ) : null,
        position: p.position
      }))));
      
      return res.status(404).json({
        success: false,
        message: 'Player not found in team',
        debug: { requestedId: playerId }
      });
    }
    
    // Update for captain role
    if (isCaptain !== undefined) {
      // If setting as captain, remove captain role from any other player
      if (isCaptain) {
        team.players.forEach((p, idx) => {
          if (idx !== playerIndex) {
            p.isCaptain = false;
          }
        });
      }
      team.players[playerIndex].isCaptain = isCaptain;
    }
    
    // Update for vice-captain role
    if (isViceCaptain !== undefined) {
      // If setting as vice-captain, remove vice-captain role from any other player
      if (isViceCaptain) {
        team.players.forEach((p, idx) => {
          if (idx !== playerIndex) {
            p.isViceCaptain = false;
          }
        });
      }
      team.players[playerIndex].isViceCaptain = isViceCaptain;
    }
    
    // Update bench status with proper validation
    if (isOnBench !== undefined) {
      // Get current bench status of the player
      const currentBenchStatus = team.players[playerIndex].isOnBench;
      
      // Only proceed if there's an actual change
      if (currentBenchStatus !== isOnBench) {
        // Count current bench players and starting players
        const benchCount = team.players.filter(p => p.isOnBench).length;
        const totalPlayers = team.players.length;
        const startingCount = totalPlayers - benchCount;
        
        // Calculate how many bench players we'd have after this change
        const newBenchCount = isOnBench ? benchCount + 1 : benchCount - 1;
        
        // Calculate how many starting players we'd have after this change
        const newStartingCount = isOnBench ? startingCount - 1 : startingCount + 1;

        console.log('Bench Count:', benchCount);
        console.log('Starting Count:', startingCount);
        
        if (isOnBench) {
          // Moving player TO bench: ensure we still have exactly 11 starting players
          if (newStartingCount < 11) {
            return res.status(400).json({
              success: false,
              message: `You must have exactly 11 starting players. You currently have ${startingCount} and would have ${newStartingCount} after this change.`
            });
          }
        } else {
          // Moving player FROM bench: ensure we won't exceed 11 starting players
          if (newStartingCount > 11) {
            return res.status(400).json({
              success: false,
              message: `You cannot have more than 11 starting players. You currently have ${startingCount} and would have ${newStartingCount} after this change.`
            });
          }
        }
        
        // Apply the bench status change
        team.players[playerIndex].isOnBench = isOnBench;
      }
    }
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error('Error in updatePlayerRole:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update multiple player roles at once
// @route   PUT /api/teams/players
// @access  Private
exports.updatePlayerRoles = async (req, res) => {
  try {
    const { players } = req.body;
    
    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of player updates'
      });
    }

    console.log('Received player updates:', JSON.stringify(players));
    
    const team = await Team.findOne({ user: req.user.id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    // Create a more efficient lookup map for players in the team
    const teamPlayerMap = new Map();
    
    // Index players by multiple possible ID formats for flexible matching
    team.players.forEach((p, index) => {
      // Add by team player entry ID
      if (p._id) {
        teamPlayerMap.set(p._id.toString(), index);
      }
      
      // Add by player reference ID (string or ObjectId)
      if (typeof p.player === 'string') {
        teamPlayerMap.set(p.player, index);
      } else if (p.player && p.player.toString) {
        teamPlayerMap.set(p.player.toString(), index);
      }
      
      // Add by populated player object ID
      if (typeof p.player === 'object' && p.player && p.player._id) {
        teamPlayerMap.set(p.player._id.toString(), index);
      }
    });
    
    // Validate the proposed changes before applying them
    const updatedPlayers = [...team.players]; // Create a copy for validation
    
    // Track players we couldn't find for better error reporting
    const notFoundPlayers = [];
    
    // Apply proposed changes to our copy for validation
    for (const update of players) {
      // First try playerId property (from client)
      let playerId = update.playerId;
      
      // If that's not available, try player property
      if (!playerId && update.player) {
        playerId = typeof update.player === 'object' ? update.player._id : update.player;
      }
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Each player update must include a playerId'
        });
      }

      const { isOnBench, isCaptain, isViceCaptain } = update;
      
      // Find player index using our lookup map
      let playerIndex = teamPlayerMap.get(playerId);
      
      // If not found by direct key lookup, try a more flexible approach
      if (playerIndex === undefined) {
        // Try to find by string comparison (in case of non-standard IDs)
        for (const [key, index] of teamPlayerMap.entries()) {
          if (key.includes(playerId) || playerId.includes(key)) {
            playerIndex = index;
            break;
          }
        }
        
        // If still not found, add to not found list
        if (playerIndex === undefined) {
          notFoundPlayers.push(playerId);
          continue;
        }
      }
      
      // Apply the updates to our copy
      if (isOnBench !== undefined) {
        updatedPlayers[playerIndex].isOnBench = isOnBench;
      }
      if (isCaptain !== undefined) {
        updatedPlayers[playerIndex].isCaptain = isCaptain;
      }
      if (isViceCaptain !== undefined) {
        updatedPlayers[playerIndex].isViceCaptain = isViceCaptain;
      }
    }
    
    // If we couldn't find some players, return an error with helpful debug info
    if (notFoundPlayers.length > 0) {
      console.error(`Players not found: ${notFoundPlayers.join(', ')}`);
      console.log('Available IDs in team:', Array.from(teamPlayerMap.keys()));
      
      return res.status(404).json({
        success: false,
        message: `Could not find players with IDs: ${notFoundPlayers.join(', ')}`,
        notFoundPlayers
      });
    }
    
    // Validate captain and vice-captain (only one of each allowed)
    const captainCount = updatedPlayers.filter(p => p.isCaptain).length;
    const viceCaptainCount = updatedPlayers.filter(p => p.isViceCaptain).length;
    
    if (captainCount > 1) {
      return res.status(400).json({
        success: false,
        message: 'Team can only have one captain'
      });
    }
    
    if (viceCaptainCount > 1) {
      return res.status(400).json({
        success: false,
        message: 'Team can only have one vice-captain'
      });
    }
    
    // Validate starting XI vs bench players
    const benchCount = updatedPlayers.filter(p => p.isOnBench).length;
    const totalPlayers = updatedPlayers.length;
    const startingCount = totalPlayers - benchCount;
    
    if (totalPlayers > 0 && startingCount !== 11) {
      return res.status(400).json({
        success: false,
        message: `You must have exactly 11 starting players. Current count: ${startingCount}`
      });
    }
    
    // All validation passed, now apply the changes to the actual team
    for (const update of players) {
      // Use same ID detection logic as above
      let playerId = update.playerId;
      if (!playerId && update.player) {
        playerId = typeof update.player === 'object' ? update.player._id : update.player;
      }
      
      const { isOnBench, isCaptain, isViceCaptain } = update;
      
      // Find player index using the same lookup logic
      let playerIndex = teamPlayerMap.get(playerId);
      
      // Try more flexible matching if direct lookup fails
      if (playerIndex === undefined) {
        for (const [key, index] of teamPlayerMap.entries()) {
          if (key.includes(playerId) || playerId.includes(key)) {
            playerIndex = index;
            break;
          }
        }
      }
      
      if (playerIndex !== undefined) {
        if (isOnBench !== undefined) {
          team.players[playerIndex].isOnBench = isOnBench;
        }
        if (isCaptain !== undefined) {
          // If setting as captain, remove captain from others
          if (isCaptain) {
            team.players.forEach((p, idx) => {
              if (idx !== playerIndex) {
                p.isCaptain = false;
              }
            });
          }
          team.players[playerIndex].isCaptain = isCaptain;
        }
        if (isViceCaptain !== undefined) {
          // If setting as vice-captain, remove vice-captain from others
          if (isViceCaptain) {
            team.players.forEach((p, idx) => {
              if (idx !== playerIndex) {
                p.isViceCaptain = false;
              }
            });
          }
          team.players[playerIndex].isViceCaptain = isViceCaptain;
        }
      }
    }
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error('Error in updatePlayerRoles:', err);
    console.error('Request payload:', JSON.stringify(req.body)); // Log the request payload for debugging
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get available players for selection
// @route   GET /api/teams/available-players
// @access  Private
exports.getAvailablePlayers = async (req, res) => {
  try {
    const { position } = req.query;
    
    const query = {};
    if (position) {
      query.position = position;
    }
    
    const players = await Player.find(query).sort({ price: -1 });
    
    res.status(200).json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Reset team
// @route   DELETE /api/teams
// @access  Private
exports.resetTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ user: req.user.id });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    // Reset team to initial state
    team.players = [];
    team.budget = 100.0;
    team.totalPoints = 0;
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Process player transfers
// @route   POST /api/teams/transfers
// @access  Private
exports.transferPlayers = async (req, res) => {
  try {
    const { transfers } = req.body;
    
    if (!Array.isArray(transfers) || transfers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of transfers'
      });
    }

    // Get the user's team
    let team = await Team.findOne({ user: req.user.id }).populate('players.player');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team found for this user'
      });
    }
    
    // Process each transfer
    let totalTransferCost = 0;
    let playersToRemove = [];
    let playersToAdd = [];
    
    for (const transfer of transfers) {
      const { in: playerIn, out: playerOut } = transfer;
      
      // Validate incoming player
      if (!playerIn || !playerIn.player) {
        return res.status(400).json({
          success: false,
          message: 'Each transfer must have an incoming player'
        });
      }

      // Get incoming player details
      const incomingPlayer = await Player.findById(playerIn.player);
      if (!incomingPlayer) {
        return res.status(400).json({
          success: false,
          message: `Incoming player not found: ${playerIn.player}`
        });
      }

      // Validate outgoing player (if provided)
      if (playerOut && playerOut.player) {
        // Find the outgoing player in the team
        const outgoingPlayerIndex = team.players.findIndex(p => {
          if (typeof p.player === 'object' && p.player) {
            return p.player._id.toString() === playerOut.player.toString();
          } else {
            return p.player.toString() === playerOut.player.toString();
          }
        });

        if (outgoingPlayerIndex === -1) {
          return res.status(400).json({
            success: false,
            message: `Outgoing player not found in team: ${playerOut.player}`
          });
        }

        // Mark player for removal
        playersToRemove.push(playerOut.player.toString());
        
        // Calculate transfer cost and include outgoing player's value
        const outgoingPlayerObj = team.players[outgoingPlayerIndex];
        const outPlayer = typeof outgoingPlayerObj.player === 'object' ? 
                         outgoingPlayerObj.player : 
                         await Player.findById(outgoingPlayerObj.player);
                         
        totalTransferCost += incomingPlayer.price - outPlayer.price;

      } else {
        // If no outgoing player, just add the full cost of the incoming player
        totalTransferCost += incomingPlayer.price;
      }
      
      // Prepare the player to add with the correct roles
      const newPlayer = {
        player: incomingPlayer,
        position: incomingPlayer.position,
        isOnBench: playerIn.isOnBench || false,
        isCaptain: playerIn.isCaptain || false,
        isViceCaptain: playerIn.isViceCaptain || false
      };
      
      playersToAdd.push(newPlayer);
    }
    
    // Check if the team has enough budget for these transfers
    const remainingBudget = team.budget - totalTransferCost;
    console.log('Remaining Budget:', remainingBudget);
    
    if (remainingBudget < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient budget for these transfers',
        remainingBudget: remainingBudget,
        totalTransferCost: totalTransferCost
      });
    }
    
    // Remove outgoing players from the team
    if (playersToRemove.length > 0) {
      team.players = team.players.filter(p => {
        const playerId = typeof p.player === 'object' ? 
                        p.player._id.toString() : 
                        p.player.toString();
        return !playersToRemove.includes(playerId);
      });
    }
    
    // Add incoming players to the team
    team.players = [...team.players, ...playersToAdd];
    
    // Update team budget
    team.budget = remainingBudget;
    
    // Validate team composition after transfers
    const startingPlayers = team.players.filter(p => !p.isOnBench);
    const benchPlayers = team.players.filter(p => p.isOnBench);
    
    // If we have a complete team, validate the formation
    if (startingPlayers.length === 11) {
      // Count positions in starting 11
      const positionCounts = {
        GK: startingPlayers.filter(p => 
            (typeof p.player === 'object' && p.player ? p.player.position : p.position) === 'GK')
            .length,
        DEF: startingPlayers.filter(p => 
            (typeof p.player === 'object' && p.player ? p.player.position : p.position) === 'DEF')
            .length,
        MID: startingPlayers.filter(p => 
            (typeof p.player === 'object' && p.player ? p.player.position : p.position) === 'MID')
            .length,
        FWD: startingPlayers.filter(p => 
            (typeof p.player === 'object' && p.player ? p.player.position : p.position) === 'FWD')
            .length
      };
      
      // Parse formation (e.g., '4-4-2' means 4 DEF, 4 MID, 2 FWD)
      const [def, mid, fwd] = team.formation.split('-').map(Number);
      
      // Validate counts
      if (positionCounts.GK !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Team must have exactly 1 starting goalkeeper'
        });
      }
      if (positionCounts.DEF !== def) {
        return res.status(400).json({
          success: false,
          message: `Formation ${team.formation} requires ${def} defenders, but found ${positionCounts.DEF}`
        });
      }
      if (positionCounts.MID !== mid) {
        return res.status(400).json({
          success: false,
          message: `Formation ${team.formation} requires ${mid} midfielders, but found ${positionCounts.MID}`
        });
      }
      if (positionCounts.FWD !== fwd) {
        return res.status(400).json({
          success: false,
          message: `Formation ${team.formation} requires ${fwd} forwards, but found ${positionCounts.FWD}`,
          team: team
        });
      }
    }
    
    // Save the updated team
    await team.save();
    
    // Return the updated team with populated player data
    const updatedTeam = await Team.findById(team._id).populate('players.player');
    
    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (err) {
    console.error('Error in transferPlayers:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};
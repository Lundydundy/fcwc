'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import teamService from '@/utils/api/teamService';

// Define consistent types
interface Player {
  id: string;
  name: string;
  club: string;
  position: string;
  price: number;
  totalPoints: number;
}

interface TeamPlayer {
  _id?: string;
  player: string | Player;
  position: string;
  isOnBench: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  benchOrder?: number;  // Position on bench (0-based index)
}

interface Team {
  id: string;
  name: string;
  formation: string;
  budget: number;
  totalPoints: number;
  players: TeamPlayer[];
}

// Main component
export default function EditFormation() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [team, setTeam] = useState<Team | null>(null);
  const [startingPlayers, setStartingPlayers] = useState<TeamPlayer[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<TeamPlayer[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [viceCaptain, setViceCaptain] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<TeamPlayer | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [formationChanged, setFormationChanged] = useState<boolean>(false);
  const [currentGameweek, setCurrentGameweek] = useState<{ number: number; deadline: string } | null>(null);
  const [gameweekPoints, setGameweekPoints] = useState<number | null>(null);

  // Available formations
  const availableFormations = ['4-3-3', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '5-4-1', '4-5-1'];

  // Position order for display
  const positions = ['GK', 'DEF', 'MID', 'FWD'];

  // Group players by position for the pitch display
  const playersByPosition = {
    GK: startingPlayers.filter(p => p.position === 'GK'),
    DEF: startingPlayers.filter(p => p.position === 'DEF'),
    MID: startingPlayers.filter(p => p.position === 'MID'),
    FWD: startingPlayers.filter(p => p.position === 'FWD'),
  };

  // Get formation counts
  const getFormationCounts = (formationString: string) => {
    const parts = formationString.split('-').map(Number);
    return {
      DEF: parts[0],
      MID: parts[1], 
      FWD: parts[2],
      GK: 1 // Always 1 goalkeeper
    };
  };

  // Get player ID consistently
  const getPlayerId = (player: any): string => {
    if (typeof player === 'object' && player !== null && player.id) {
      return player.id;
    } else if (typeof player === 'string') {
      return player;
    } else if (typeof player === 'object' && player !== null && player._id) {
      return player._id;
    }
    console.error('Invalid player data structure:', player);
    return `invalid-player-${Date.now()}`;
  };

  // Get player name
  const getPlayerName = (player: TeamPlayer): string => {
    if (typeof player.player === 'object' && player.player !== null) {
      return player.player.name;
    }
    return 'Unknown Player';
  };

  // Get player club
  const getPlayerClub = (player: TeamPlayer): string => {
    if (typeof player.player === 'object' && player.player !== null) {
      return player.player.club;
    }
    return '';
  };

  // Load team data
  useEffect(() => {
    const loadTeam = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await teamService.getUserTeam();
        setTeam(response);
        setSelectedFormation(response.formation);
          // Separate players into starting and bench
        const starting = response.players.filter((p: TeamPlayer) => !p.isOnBench);
        let bench = response.players.filter((p: TeamPlayer) => p.isOnBench);
        
        // Sort bench players by benchOrder if available, otherwise ensure goalkeepers are first
        bench = bench.sort((a: TeamPlayer, b: TeamPlayer) => {
          // If benchOrder is available, use it
          if (a.benchOrder !== undefined && b.benchOrder !== undefined) {
            return a.benchOrder - b.benchOrder;
          }
          
          // Otherwise, make sure GK is always first
          if (a.position === 'GK' && b.position !== 'GK') {
            return -1;
          }
          if (a.position !== 'GK' && b.position === 'GK') {
            return 1;
          }
          
          // If both are GK or both are not GK, keep original order
          return 0;
        });
        
        setStartingPlayers(starting);
        setBenchPlayers(bench);
        
        // Set captain and vice-captain
        const captainPlayer = response.players.find((p: TeamPlayer) => p.isCaptain);
        const viceCaptainPlayer = response.players.find((p: TeamPlayer) => p.isViceCaptain);
        
        if (captainPlayer) {
          setCaptain(getPlayerId(captainPlayer.player));
        }
        
        if (viceCaptainPlayer) {
          setViceCaptain(getPlayerId(viceCaptainPlayer.player));
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load team');
        setLoading(false);
      }
    };
    
    loadTeam();
  }, []);


  // Handle formation change
  const handleFormationChange = (newFormation: string) => {
    if (!team) return;
    
    // Don't do anything if formation doesn't change
    if (newFormation === selectedFormation) return;
    
    // Calculate new position requirements
    const currentCounts = {
      GK: playersByPosition.GK.length,
      DEF: playersByPosition.DEF.length,
      MID: playersByPosition.MID.length,
      FWD: playersByPosition.FWD.length
    };
    
    const newCounts = getFormationCounts(newFormation);
    
    // Check if we can satisfy formation with current players (starting + bench)
    const allPlayersByPosition = {
      GK: [...startingPlayers, ...benchPlayers].filter(p => p.position === 'GK'),
      DEF: [...startingPlayers, ...benchPlayers].filter(p => p.position === 'DEF'),
      MID: [...startingPlayers, ...benchPlayers].filter(p => p.position === 'MID'),
      FWD: [...startingPlayers, ...benchPlayers].filter(p => p.position === 'FWD')
    };
    
    const formationIsPossible = positions.every(pos => {
      return allPlayersByPosition[pos as keyof typeof allPlayersByPosition].length >= 
        newCounts[pos as keyof typeof newCounts];
    });
    
    if (!formationIsPossible) {
      setError(`You don't have enough players for ${newFormation} formation. Please add appropriate players first.`);
      return;
    }
    
    setSelectedFormation(newFormation);
    setFormationChanged(true);
    setSuccessMessage('');
    setError('');
    
    // Auto-adjust starting lineup when possible
    const newStartingPlayers: TeamPlayer[] = [];
    const newBenchPlayers: TeamPlayer[] = [...benchPlayers];
    
    // Keep GK (always 1)
    if (playersByPosition.GK.length > 0) {
      newStartingPlayers.push(...playersByPosition.GK);
    } else if (newBenchPlayers.some(p => p.position === 'GK')) {
      const gk = newBenchPlayers.find(p => p.position === 'GK');
      if (gk) {
        newStartingPlayers.push({...gk, isOnBench: false});
        newBenchPlayers.splice(newBenchPlayers.indexOf(gk), 1);
      }
    }
    
    // For DEF, MID, FWD - take what we can from starting, and fill from bench if needed
    ['DEF', 'MID', 'FWD'].forEach(pos => {
      const positionPlayers = playersByPosition[pos as keyof typeof playersByPosition];
      const required = newCounts[pos as keyof typeof newCounts];
      
      // If we already have exact count, keep them all
      if (positionPlayers.length === required) {
        newStartingPlayers.push(...positionPlayers);
      }
      // If we have too many, keep required amount and move rest to bench
      else if (positionPlayers.length > required) {
        newStartingPlayers.push(...positionPlayers.slice(0, required));
        newBenchPlayers.push(
          ...positionPlayers.slice(required).map(p => ({...p, isOnBench: true}))
        );
      }
      // If we need more, take from bench
      else if (positionPlayers.length < required) {
        // First add all current starters
        newStartingPlayers.push(...positionPlayers);
        
        // Find players of this position on the bench
        const benchPos = newBenchPlayers.filter(p => p.position === pos);
        const neededFromBench = required - positionPlayers.length;
        
        if (benchPos.length >= neededFromBench) {
          // Get players from bench to add to starting XI
          const movedPlayers = benchPos.slice(0, neededFromBench);
          
          // Add to starting XI
          newStartingPlayers.push(
            ...movedPlayers.map(p => ({...p, isOnBench: false}))
          );
          
          // Remove from bench
          movedPlayers.forEach(player => {
            const idx = newBenchPlayers.findIndex(
              p => getPlayerId(p.player) === getPlayerId(player.player)
            );
            if (idx !== -1) {
              newBenchPlayers.splice(idx, 1);
            }
          });
        }
      }
    });
    
    setStartingPlayers(newStartingPlayers);
    setBenchPlayers(newBenchPlayers);
    
    // Log formation change for debugging
    console.log(`Formation changed from ${team.formation} to ${newFormation}`);
  };

  // Move player between starting XI and bench
  const movePlayer = (player: TeamPlayer) => {
    const playerId = getPlayerId(player.player);
    
    // Check formation rules when moving to starting XI
    if (player.isOnBench) {
      if (!team) return;
      
      const formationCounts = getFormationCounts(selectedFormation);
      const positionCount = startingPlayers.filter(p => p.position === player.position).length;
      
      if (positionCount >= formationCounts[player.position as keyof typeof formationCounts]) {
        setError(`You already have the maximum number of ${player.position} players allowed in your formation (${formationCounts[player.position as keyof typeof formationCounts]})`);
        return;
      }
    }
    
    // Create updated player
    const updatedPlayer = {
      ...player,
      isOnBench: !player.isOnBench
    };
    
    // Update player lists
    if (!player.isOnBench) {
      // Move to bench
      setStartingPlayers(startingPlayers.filter(p => getPlayerId(p.player) !== playerId));
      setBenchPlayers([...benchPlayers, updatedPlayer]);
      
      // Remove captain/vice-captain if benched
      if (captain === playerId) setCaptain(null);
      if (viceCaptain === playerId) setViceCaptain(null);
    } else {
      // Move to starting XI
      setBenchPlayers(benchPlayers.filter(p => getPlayerId(p.player) !== playerId));
      setStartingPlayers([...startingPlayers, updatedPlayer]);
    }
    
    setError('');
  };

  // Handle player click to show details
  const selectPlayer = (player: TeamPlayer) => {
    setSelectedPlayer(player);
  };
  
  // Set captain
  const handleSetCaptain = (playerId: string) => {
    // Can only set starting players as captain
    const playerIsStarting = startingPlayers.some(p => getPlayerId(p.player) === playerId);
    if (!playerIsStarting) {
      setError('Only starting players can be captain');
      return;
    }
    
    // If this was vice-captain, remove that role
    if (viceCaptain === playerId) setViceCaptain(null);
    
    // Toggle captain status
    setCaptain(captain === playerId ? null : playerId);
  };
  
  // Set vice-captain
  const handleSetViceCaptain = (playerId: string) => {
    // Can only set starting players as vice-captain
    const playerIsStarting = startingPlayers.some(p => getPlayerId(p.player) === playerId);
    if (!playerIsStarting) {
      setError('Only starting players can be vice-captain');
      return;
    }
    
    // If this was captain, remove that role
    if (captain === playerId) setCaptain(null);
    
    // Toggle vice-captain status
    setViceCaptain(viceCaptain === playerId ? null : playerId);
  };
  
  // Save changes
  const saveChanges = async () => {
    try {
      // Validate captaincy
      if (!captain) {
        setError('You must select a captain');
        return;
      }

      if (!viceCaptain) {
        setError('You must select a vice-captain');
        return;
      }
      
      // Make sure starting XI is valid
      if (startingPlayers.length !== 11) {
        setError(`Your starting XI must have exactly 11 players (currently ${startingPlayers.length})`);
        return;
      }
      
      // Check formation is valid
      const formationCounts = getFormationCounts(selectedFormation);
      const currentCounts = {
        GK: playersByPosition.GK.length,
        DEF: playersByPosition.DEF.length,
        MID: playersByPosition.MID.length,
        FWD: playersByPosition.FWD.length
      };
      
      for (const pos of positions) {
        if (currentCounts[pos as keyof typeof currentCounts] !== formationCounts[pos as keyof typeof formationCounts]) {
          setError(`Your formation requires ${formationCounts[pos as keyof typeof formationCounts]} ${pos} players, but you have ${currentCounts[pos as keyof typeof currentCounts]}`);
          return;
        }
      }
      
      setSaving(true);
      setError('');
      
      // Update formation if changed
      if (formationChanged && team && selectedFormation !== team.formation) {
        await teamService.updateTeam({ formation: selectedFormation });
      }      // Define the type for player updates
      interface PlayerUpdate {
        playerId: string;
        isOnBench: boolean;
        isCaptain: boolean;
        isViceCaptain: boolean;
        benchOrder?: number;
      }
      
      // Prepare player updates
      const updatedPlayers: PlayerUpdate[] = [];

      // Process starting players first (no bench order needed)
      startingPlayers.forEach(player => {
        const playerId = getPlayerId(player.player);
        updatedPlayers.push({
          playerId: playerId,
          isOnBench: false,
          isCaptain: playerId === captain,
          isViceCaptain: playerId === viceCaptain
        });
      });
      
      // Process bench players with their order preserved
      benchPlayers.forEach((player, index) => {
        const playerId = getPlayerId(player.player);
        updatedPlayers.push({
          playerId: playerId,
          isOnBench: true,
          isCaptain: false,
          isViceCaptain: false,
          benchOrder: index // Store their position in the bench lineup (0-based index)
        });
      });
      
      // Log player updates for debugging
      console.log('Sending player role updates:', updatedPlayers);
      
      // Update all player roles in a single API call
      await teamService.updatePlayerRoles({ players: updatedPlayers });
      
      setSuccessMessage('Team updated successfully!');
      setSaving(false);
      setFormationChanged(false);
      
      // Show success message before redirecting
      setTimeout(() => {
        router.push('/dashboard?tab=myTeam');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to save team changes');
      setSaving(false);
    }
  };

  // Calculate formation limits
  const formationLimits = selectedFormation ? getFormationCounts(selectedFormation) : { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  
  // Move bench player left or right
  const handleMoveBenchPlayer = (currentIndex: number, direction: 'left' | 'right') => {
    // Make a copy of benchPlayers
    const newBenchPlayers = [...benchPlayers];
    
    // Calculate target index
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (targetIndex < 0 || targetIndex >= newBenchPlayers.length) {
      return; // Out of bounds, do nothing
    }
    
    // Special handling for GK - GK must always be in the first position
    const currentPlayer = newBenchPlayers[currentIndex];
    const targetPlayer = newBenchPlayers[targetIndex];
    
    // If player is GK, don't allow moving right
    if (currentPlayer.position === 'GK' && direction === 'right') {
      return;
    }
    
    // If target is GK, don't allow moving left
    if (targetPlayer.position === 'GK' && direction === 'left') {
      return;
    }
    
    // Swap the players in the list
    [newBenchPlayers[currentIndex], newBenchPlayers[targetIndex]] = 
      [newBenchPlayers[targetIndex], newBenchPlayers[currentIndex]];
    
    // Update the state with the new bench order
    setBenchPlayers(newBenchPlayers);
  };

  // Responsive: show a simplified view for very small screens
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 500);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-lg text-gray-500">Loading your team...</p>
        </div>
      </div>
    );
  }
  
  if (isMobileView) {
    return (
      <div className="max-w-md mx-auto py-6 px-2">
        <h1 className="text-xl font-bold mb-4 text-center">Edit Formation</h1>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="mb-4 text-gray-700">
            The full formation editor is not available on very small screens.<br />
            Please rotate your device or use a larger screen for the best experience.
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <span className="font-semibold">Current Formation:</span> {team?.formation || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Players:</span> {team?.players?.length || 0}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 sm:px-6 lg:px-8">
      {/* Back to Dashboard Button - Always Visible */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-medium transition-colors"
        >
          <span className="mr-2">←</span> Back to Dashboard
        </button>
      </div>

      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate">
            Edit Team Formation
          </h2>
          {team && (
            <p className="mt-1 text-sm text-green-500">
              {team.name}
            </p>
          )}
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => router.push('/dashboard?tab=myTeam')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* Formation selector */}
      <div className="mb-6">
        <label htmlFor="formation" className="block text-sm font-medium text-white mb-2">
          Formation
        </label>
        <div className="flex items-center bg-white p-4 rounded-md">
          <select
            id="formation"
            name="formation"
            value={selectedFormation}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md text-black"
          >
            {availableFormations.map((formation) => (
              <option key={formation} value={formation}>
                {formation} 
                {formation === team?.formation ? ' (Current)' : ''}
              </option>
            ))}
          </select>
          {formationChanged && (
            <span className="ml-3 text-sm text-amber-600 font-medium">
              Formation changed from {team?.formation} to {selectedFormation}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Changing formation will auto-adjust your lineup to match the new requirements.
        </p>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pitch view */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-green-800 text-white">
              <h3 className="text-lg leading-6 font-medium">Pitch View</h3>
              <p className="mt-1 max-w-2xl text-sm">
                Formation: {selectedFormation} • Starting XI: {startingPlayers.length}/11
              </p>
            </div>
            
            <div className="p-4">
              <div className="soccer-pitch">
                {/* GK Row */}
                <div className="pitch-row gk-row">
                  <div className="position-label">GK</div>
                  <div className="players-container">
                    {playersByPosition.GK.map((player, idx) => {
                      const playerId = getPlayerId(player.player);
                      const isSelectedPlayer = selectedPlayer && getPlayerId(selectedPlayer.player) === playerId;
                      return (
                        <div 
                          key={`gk-${idx}`} 
                          className={`player-spot ${isSelectedPlayer ? 'selected' : ''}`}
                          onClick={() => selectPlayer(player)}
                        >
                          <div className="player-info">
                            <div className="player-name">{getPlayerName(player).split(' ').pop()}</div>
                            <div className="player-jerseys">
                              {playerId === captain && (
                                <div className="captain-badge" title="Captain">C</div>
                              )}
                              {playerId === viceCaptain && (
                                <div className="vice-badge" title="Vice Captain">V</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {playersByPosition.GK.length < formationLimits.GK && (
                      Array.from({ length: formationLimits.GK - playersByPosition.GK.length }).map((_, idx) => (
                        <div key={`gk-empty-${idx}`} className="player-spot empty">
                          <div className="player-info">
                            <div className="player-missing">GK</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* DEF Row */}
                <div className="pitch-row def-row">
                  <div className="position-label">DEF</div>
                  <div className="players-container">
                    {playersByPosition.DEF.map((player, idx) => {
                      const playerId = getPlayerId(player.player);
                      const isSelectedPlayer = selectedPlayer && getPlayerId(selectedPlayer.player) === playerId;
                      return (
                        <div 
                          key={`def-${idx}`} 
                          className={`player-spot ${isSelectedPlayer ? 'selected' : ''}`}
                          onClick={() => selectPlayer(player)}
                        >
                          <div className="player-info">
                            <div className="player-name">{getPlayerName(player).split(' ').pop()}</div>
                            <div className="player-jerseys">
                              {playerId === captain && (
                                <div className="captain-badge" title="Captain">C</div>
                              )}
                              {playerId === viceCaptain && (
                                <div className="vice-badge" title="Vice Captain">V</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {playersByPosition.DEF.length < formationLimits.DEF && (
                      Array.from({ length: formationLimits.DEF - playersByPosition.DEF.length }).map((_, idx) => (
                        <div key={`def-empty-${idx}`} className="player-spot empty">
                          <div className="player-info">
                            <div className="player-missing">DEF</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* MID Row */}
                <div className="pitch-row mid-row">
                  <div className="position-label">MID</div>
                  <div className="players-container">
                    {playersByPosition.MID.map((player, idx) => {
                      const playerId = getPlayerId(player.player);
                      const isSelectedPlayer = selectedPlayer && getPlayerId(selectedPlayer.player) === playerId;
                      return (
                        <div 
                          key={`mid-${idx}`} 
                          className={`player-spot ${isSelectedPlayer ? 'selected' : ''}`}
                          onClick={() => selectPlayer(player)}
                        >
                          <div className="player-info">
                            <div className="player-name">{getPlayerName(player).split(' ').pop()}</div>
                            <div className="player-jerseys">
                              {playerId === captain && (
                                <div className="captain-badge" title="Captain">C</div>
                              )}
                              {playerId === viceCaptain && (
                                <div className="vice-badge" title="Vice Captain">V</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {playersByPosition.MID.length < formationLimits.MID && (
                      Array.from({ length: formationLimits.MID - playersByPosition.MID.length }).map((_, idx) => (
                        <div key={`mid-empty-${idx}`} className="player-spot empty">
                          <div className="player-info">
                            <div className="player-missing">MID</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* FWD Row */}
                <div className="pitch-row fwd-row">
                  <div className="position-label">FWD</div>
                  <div className="players-container">
                    {playersByPosition.FWD.map((player, idx) => {
                      const playerId = getPlayerId(player.player);
                      const isSelectedPlayer = selectedPlayer && getPlayerId(selectedPlayer.player) === playerId;
                      return (
                        <div 
                          key={`fwd-${idx}`} 
                          className={`player-spot ${isSelectedPlayer ? 'selected' : ''}`}
                          onClick={() => selectPlayer(player)}
                        >
                          <div className="player-info">
                            <div className="player-name">{getPlayerName(player).split(' ').pop()}</div>
                            <div className="player-jerseys">
                              {playerId === captain && (
                                <div className="captain-badge" title="Captain">C</div>
                              )}
                              {playerId === viceCaptain && (
                                <div className="vice-badge" title="Vice Captain">V</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {playersByPosition.FWD.length < formationLimits.FWD && (
                      Array.from({ length: formationLimits.FWD - playersByPosition.FWD.length }).map((_, idx) => (
                        <div key={`fwd-empty-${idx}`} className="player-spot empty">
                          <div className="player-info">
                            <div className="player-missing">FWD</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Captain</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Vice Captain</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bench Area */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white">
              <h3 className="text-lg leading-6 font-medium">Bench</h3>
              <p className="mt-1 max-w-2xl text-sm">
                {benchPlayers.length} players
              </p>
            </div>
            
            <div className="p-4">
              <div className="bench-area">
                {benchPlayers.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    No players on the bench
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {benchPlayers.map((player, idx) => {
                    const playerId = getPlayerId(player.player);
                    const isSelectedPlayer = selectedPlayer && getPlayerId(selectedPlayer.player) === playerId;
                    
                    return (
                      <div 
                        key={`bench-${idx}`} 
                        className={`bench-player ${isSelectedPlayer ? 'selected' : ''}`}
                        onClick={() => selectPlayer(player)}
                      >                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">
                              {getPlayerName(player).split(' ').pop()}
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                                idx === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`} title="Substitution order">
                                {idx === 0 ? '1st' : (idx === 1 ? '2nd' : (idx === 2 ? '3rd' : `${idx+1}th`))}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{getPlayerClub(player)}</div>
                            <div className="mt-1 text-xs inline-block bg-gray-100 px-2 py-0.5 rounded">
                              {player.position}
                            </div>
                          </div>
                            {/* Move buttons for bench players */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBenchPlayer(idx, 'left');
                              }}
                              disabled={idx === 0 || (player.position === 'GK')}
                              className={`ml-2 p-1 rounded-full 
                                ${idx === 0 || (player.position === 'GK') ? 'opacity-50 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="Move left (higher priority)"
                            >
                              <svg className="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBenchPlayer(idx, 'right');
                              }}
                              disabled={idx === benchPlayers.length - 1 || (player.position === 'GK')}
                              className={`ml-2 p-1 rounded-full 
                                ${idx === benchPlayers.length - 1 || (player.position === 'GK') ? 'opacity-50 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="Move right (lower priority)"
                            >
                              <svg className="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player details panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg sticky top-4">
            <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white">
              <h3 className="text-lg leading-6 font-medium">Player Details</h3>
            </div>
            
            {selectedPlayer ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-black">{getPlayerName(selectedPlayer)}</h4>
                    <p className="text-sm text-gray-500">{getPlayerClub(selectedPlayer)}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedPlayer.position}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {selectedPlayer.isOnBench ? 'Bench' : 'Starting XI'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Player actions */}
                <div className="mt-6 space-y-4">
                  {/* Move button */}
                  <button
                    onClick={() => movePlayer(selectedPlayer)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {selectedPlayer.isOnBench ? 'Move to Starting XI' : 'Move to Bench'}
                  </button>
                  
                  {/* Captain buttons */}
                  {!selectedPlayer.isOnBench && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleSetCaptain(getPlayerId(selectedPlayer.player))}
                        disabled={selectedPlayer.isOnBench}
                        className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium 
                          ${captain === getPlayerId(selectedPlayer.player) 
                            ? 'bg-yellow-100 border-yellow-500 text-yellow-700' 
                            : 'bg-white border-gray-300 text-gray-700'} 
                          hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                      >
                        {captain === getPlayerId(selectedPlayer.player) ? 'Captain ✓' : 'Set as Captain'}
                      </button>
                      
                      <button
                        onClick={() => handleSetViceCaptain(getPlayerId(selectedPlayer.player))}
                        disabled={selectedPlayer.isOnBench}
                        className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium 
                          ${viceCaptain === getPlayerId(selectedPlayer.player) 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'bg-white border-gray-300 text-gray-700'} 
                          hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {viceCaptain === getPlayerId(selectedPlayer.player) ? 'Vice-Captain ✓' : 'Set as Vice-Captain'}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Requirements */}
                {selectedPlayer.isOnBench && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                    <p className="text-sm text-yellow-700">
                      Only players in the Starting XI can be captain or vice-captain.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 sm:px-6 text-center text-gray-500">
                <p>Select a player to view details</p>
              </div>
            )}
            
            {/* Team requirements */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Team Requirements</h4>
              <ul className="space-y-2 text-sm">
                <li className={`flex items-center ${startingPlayers.length === 11 ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{startingPlayers.length === 11 ? '✓' : '✗'}</span>
                  Starting XI: {startingPlayers.length}/11 players
                </li>
                <li className={`flex items-center ${captain ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{captain ? '✓' : '✗'}</span>
                  Captain selected
                </li>
                <li className={`flex items-center ${viceCaptain ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{viceCaptain ? '✓' : '✗'}</span>
                  Vice-captain selected
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for the soccer pitch */}
      <style jsx>{`
        .soccer-pitch {
          background: #38A169;
          border-radius: 8px;
          padding: 20px;
          position: relative;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }
        
        .soccer-pitch:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: rgba(255, 255, 255, 0.6);
        }
        
        .soccer-pitch:after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.6);
        }
        
        .pitch-row {
          flex: 1;
          display: flex;
          margin-bottom: 10px;
          position: relative;
        }
        
        .position-label {
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          margin-right: 10px;
          font-size: 14px;
        }
        
        .players-container {
          flex: 1;
          display: flex;
          justify-content: space-evenly;
          align-items: center;
        }
        
        .player-spot {
          width: 70px;
          height: 70px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .player-spot:hover {
          transform: scale(1.05);
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .player-spot.selected {
          border-color: white;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
          transform: scale(1.05);
        }
        
        .player-spot.empty {
          background-color: rgba(255, 255, 255, 0.1);
          cursor: default;
        }
        
        .player-info {
          text-align: center;
        }
        
        .player-name {
          color: white;
          font-weight: bold;
          font-size: 12px;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
          margin-bottom: 4px;
        }
        
        .player-missing {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }
        
        .player-jerseys {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }
        
        .captain-badge {
          font-size: 10px;
          font-weight: bold;
          color: white;
          background-color: #FBBF24;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .vice-badge {
          font-size: 10px;
          font-weight: bold;
          color: white;
          background-color: #3B82F6;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bench-area {
          min-height: 100px;
        }
        
        .bench-player {
          background-color: white;
          border-radius: 6px;
          padding: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .bench-player:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .bench-player.selected {
          border-color: #3B82F6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }

        .bench-player .font-medium {
          color: #111827;
          font-weight: 600;
        }

        .bench-player .text-gray-500 {
          color: #6B7280;
        }

        .bench-player .bg-gray-100 {
          background-color: #F3F4F6;
          color: #374151;
          font-weight: 500;
          border: 1px solid #E5E7EB;
        }
      `}</style>
    </div>
  );
}
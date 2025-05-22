'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import teamService from '@/utils/api/teamService';
import playerService from '@/utils/api/playerService';
import Image from 'next/image';

// Define TypeScript interfaces for our data
interface Player {
  id: string;
  name: string;
  club: string;
  position: string;
  price: number;
  totalPoints: number;
  form: number;
  stats?: {
    goals: number;
    assists: number;
    cleanSheets: number;
    saves: number;
    yellowCards: number;
    redCards: number; 
    minutesPlayed: number;
  };
}

interface TeamPlayer {
  player: Player | string;
  position: string;
  isOnBench: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

interface TeamData {
  id: string;
  name: string;
  budget: number;
  formation: string;
  totalPoints: number;
  players: TeamPlayer[];
}

export default function Transfers() {
  // State variables
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20]);
  const [sortBy, setSortBy] = useState<string>('totalPoints');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerToReplace, setPlayerToReplace] = useState<TeamPlayer | null>(null);
  // Create a unique identifier for selected player that includes position and bench status
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<string | null>(null);
  const [pendingTransfers, setPendingTransfers] = useState<{ in: Player; out: TeamPlayer }[]>([]);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage,] = useState<string | null>(null);

  const router = useRouter();

  // Fetch user's team and available players on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setErrorMessage(null);
        console.log('Loading team data...');
        // Load user's team
        const team = await teamService.getUserTeam();
        console.log('Team data loaded:', team);
        setTeamData(team);
        setTeamLoading(false);

        // Load all available players
        setPlayerLoading(true);
        console.log('Loading player data...');
        const players = await playerService.getAllPlayers();
        console.log('Player data loaded:', players?.length || 0, 'players');
        setAllPlayers(players);
        setFilteredPlayers(players);
        setPlayerLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setErrorMessage('Failed to load transfer data. Please try refreshing the page.');
        setTeamLoading(false);
        setPlayerLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter players when search criteria change
  useEffect(() => {
    if (!allPlayers.length) return;

    let results = [...allPlayers];

    // Filter by position
    if (selectedPosition !== 'All') {
      results = results.filter((player) => player.position === selectedPosition);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (player) =>
          player.name.toLowerCase().includes(term) || player.club.toLowerCase().includes(term)
      );
    }

    // Filter by price range
    results = results.filter(
      (player) => player.price >= priceRange[0] && player.price <= priceRange[1]
    );

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'totalPoints') {
        comparison = a.totalPoints - b.totalPoints;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'form') {
        comparison = a.form - b.form;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Remove players already in the user's team or pending transfers
    if (teamData && teamData.players) {
      const existingPlayerIds = new Set([
        ...teamData.players
          .filter(
            (tp) =>
              !pendingTransfers.some(
                (transfer) =>
                  typeof tp.player === 'object' && 
                  typeof transfer.out.player === 'object' && 
                  tp.player.id === transfer.out.player.id
              )
          )
          .map((tp) => (typeof tp.player === 'object' ? tp.player.id : tp.player)),
        ...pendingTransfers.map((transfer) => transfer.in.id),
      ]);

      results = results.filter((player) => !existingPlayerIds.has(player.id));
    }

    setFilteredPlayers(results);
  }, [allPlayers, selectedPosition, searchTerm, priceRange, sortBy, sortOrder, teamData, pendingTransfers]);

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle position filter change
  const handlePositionChange = (position: string) => {
    setSelectedPosition(position);
  };

  // Handle price range change
  const handlePriceRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newPrice = Number(e.target.value);
    setPriceRange((prev) => [prev[0], newPrice]);
  };

  // Handle sort change
  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Select a player to view details and potentially transfer in
  const selectPlayer = (player: Player) => {
    setSelectedPlayer(player);
  };

  // Select a player from the user's team to replace
  const selectPlayerToReplace = (teamPlayer: TeamPlayer) => {
    // Make sure player is an object and not just an ID
    if (typeof teamPlayer.player === 'object') {
      setPlayerToReplace(teamPlayer);
    }
  };

  // Add new function to generate consistent player keys
  const generatePlayerKey = (player: TeamPlayer): string => {
    const playerObj = typeof player.player === 'object' ? player.player : null;
    if (!playerObj) return '';
    return `${playerObj.id}-${player.position}-${player.isOnBench ? 'bench' : 'field'}`;
  };

  // Add a pending transfer
  const addTransfer = () => {
    if (!selectedPlayer || !playerToReplace || typeof playerToReplace.player !== 'object') {
      return;
    }

    // Check if the positions match
    if (selectedPlayer.position !== playerToReplace.position) {
      alert(`You must replace a ${playerToReplace.position} with another ${playerToReplace.position}.`);
      return;
    }

    // Add to pending transfers
    setPendingTransfers((prev) => [
      ...prev,
      {
        in: selectedPlayer,
        out: playerToReplace,
      },
    ]);

    // Reset selections
    setSelectedPlayer(null);
    setPlayerToReplace(null);
    setSelectedPlayerKey(null);
  };

  // Remove a pending transfer
  const removeTransfer = (index: number) => {
    setPendingTransfers((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate budget after pending transfers
  const calculateRemainingBudget = (): number => {
    if (!teamData) return 0;

    let budget = teamData.budget;
    pendingTransfers.forEach((transfer) => {
      if (typeof transfer.out.player === 'object') {
        budget = budget + transfer.out.player.price - transfer.in.price;
      }
    });

    return Math.round(budget * 10) / 10;
  };

  // Confirm and process all transfers
  const confirmTransfers = async () => {
    if (pendingTransfers.length === 0) return;
    setShowConfirmation(true);
  };

  // Process the confirmed transfers
  const processTransfers = async () => {
    try {
      // Format the transfer data for the API call
      const transferData = {
        transfers: pendingTransfers.map((transfer) => ({
          in: {
            player: transfer.in.id,
            position: transfer.in.position,
            isOnBench: transfer.out.isOnBench
          },
          out: {
            player: typeof transfer.out.player === 'object' ? transfer.out.player.id : transfer.out.player,
          }
        }))
      };

      // Process all transfers in a single API call

      await teamService.transferPlayers(transferData);

      // Refresh team data
      const updatedTeam = await teamService.getUserTeam();
      setTeamData(updatedTeam);

      // Clear pending transfers
      setPendingTransfers([]);
      setShowConfirmation(false);

      alert('Transfers completed successfully!');
    } catch (error) {
      console.error('Error processing transfers:', error);
      alert('Failed to make transfers. Please try again.');
      setShowConfirmation(false);
    }
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmation(false);
  };

  // Add new function to cancel current selection
  const cancelSelection = () => {
    setSelectedPlayer(null);
    setPlayerToReplace(null);
    setSelectedPlayerKey(null);
  };

  // Add new function to return to dashboard
  const goBackToDashboard = () => {
    // If there are pending transfers, confirm before leaving
    if (pendingTransfers.length > 0) {
      if (confirm('You have unsaved transfers. Are you sure you want to leave this page?')) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  // Get players by position for the team display
  const getPlayersByPosition = (position: string, onBench: boolean = false) => {
    if (!teamData || !teamData.players) return [];

    // Filter out players that are being transferred out
    const transferOutPlayerIds = new Set(
      pendingTransfers.map((transfer) =>
        typeof transfer.out.player === 'object' ? transfer.out.player.id : transfer.out.player
      )
    );

    const filteredPlayers = teamData.players.filter((player) => {
      const playerId = typeof player.player === 'object'? player.player.id : player.player;
            return (
        player.position === position &&
        player.isOnBench === onBench &&
        !transferOutPlayerIds.has(playerId)
      );
    });

    // Add players that are being transferred in
    const transferInPlayers = pendingTransfers
      .filter((transfer) => {
        const transferOutPlayer = transfer.out;
        return (
          transferOutPlayer.position === position && transferOutPlayer.isOnBench === onBench
        );
      })
      .map((transfer) => {
        return {
          player: transfer.in,
          position: transfer.in.position,
          isOnBench: transfer.out.isOnBench,
          isCaptain: transfer.out.isCaptain,
          isViceCaptain: transfer.out.isViceCaptain,
        } as TeamPlayer;
      });

    return [...filteredPlayers, ...transferInPlayers];
  };

  const isPendingTransfer = (teamPlayer: TeamPlayer) => {
    if (typeof teamPlayer.player !== 'object') return false;
    return pendingTransfers.some(
      (transfer) =>
        typeof transfer.out.player === 'object' && typeof teamPlayer.player === 'object' && transfer.out.player.id === teamPlayer.player.id
    );
  };


  

  // Loading state
  if (teamLoading || playerLoading) {
    return (
      <div className="py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading transfer data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errorMessage) {
    return (
      <div className="py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="p-6 text-center">
            <p className="text-red-500 font-medium">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty team state
  if (!teamData || !teamData.players || teamData.players.length === 0) {
    return (
      <div className="py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="p-6 text-center">
            <p className="text-gray-500">You need to create a team before making transfers.</p>
            <button
              onClick={() => router.push('/dashboard/create-team')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Transfer Players</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Make changes to your team by transferring players in and out
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={goBackToDashboard}
                className="mr-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Dashboard
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Remaining Budget</p>
                <p className="text-2xl font-bold text-green-600">£{calculateRemainingBudget().toFixed(1)}m</p>
              </div>
            </div>
          </div>

          {/* Pending Transfers */}
          {pendingTransfers.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Pending Transfers</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price Diff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTransfers.map((transfer, index) => {
                      const outPlayer =
                        typeof transfer.out.player === 'object' ? transfer.out.player : null;
                      const inPlayer = transfer.in;
                      const priceDiff = outPlayer
                        ? (inPlayer.price - outPlayer.price).toFixed(1)
                        : '0.0';
                      const isPriceNegative = outPlayer ? inPlayer.price < outPlayer.price : false;

                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-black">
                            {outPlayer ? outPlayer.name : 'Unknown Player'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-black">{inPlayer.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-black">{inPlayer.position}</td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              isPriceNegative ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isPriceNegative ? '-' : '+'}£{Math.abs(parseFloat(priceDiff)).toFixed(1)}m
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => removeTransfer(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={confirmTransfers}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Confirm Transfers
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border-t border-gray-200">
            {/* Team Section - Left Column */}
            <div className="col-span-1 bg-gray-50 p-4 rounded">
              <h4 className="text-md font-medium text-gray-700 mb-3">Your Team</h4>

              {/* Display players by position */}
              {['GK', 'DEF', 'MID', 'FWD'].map((position) => (
                <div key={position} className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">
                    {position === 'GK'
                      ? 'Goalkeepers'
                      : position === 'DEF'
                      ? 'Defenders'
                      : position === 'MID'
                      ? 'Midfielders'
                      : 'Forwards'}
                  </h5>
                  <div className="space-y-2">
                    {getPlayersByPosition(position, false).map((player, idx) => {
                      const playerObj = typeof player.player === 'object' ? player.player : null;
                      if (!playerObj) return null;

                      return (
                        <div
                          key={`${playerObj.name}-${idx}`}
                          className={`hover:bg-sky-100 cursor-pointer flex justify-between items-center p-2 rounded ${
                            selectedPlayerKey === `${idx}-${player.position}-${player.isOnBench ? 'bench' : 'field'}`
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-white'
                          } ${isPendingTransfer(player) ? 'opacity-50' : ''}`}
                          onClick={(e) => {
                          if(!isPendingTransfer(player)) selectPlayerToReplace(player)
                          setSelectedPlayerKey(`${idx}-${player.position}-${player.isOnBench ? 'bench' : 'field'}`
                          );

                          }}
                        >
                          <div className="flex items-center">
                            {player.isCaptain && (
                              <span className="mr-1 text-xs bg-yellow-400 text-white rounded-full w-4 h-4 inline-flex items-center justify-center">
                                C
                              </span>
                            )}
                            {player.isViceCaptain && (
                              <span className="mr-1 text-xs bg-gray-400 text-white rounded-full w-4 h-4 inline-flex items-center justify-center">
                                V
                              </span>
                            )}
                            <span className='text-black'>{playerObj.name}</span>
                          </div>
                          <div className="text-sm text-gray-500">£{playerObj.price.toFixed(1)}m</div>
                        </div>
                      );
                    })}

                    {/* Bench players for this position */}
                    {getPlayersByPosition(position, true).map((player, idx) => {
                      const playerObj = typeof player.player === 'object' ? player.player : null;
                      if (!playerObj) return null;

                      return (
                        <div
                          key={`bench-${playerObj.name}-${idx}`}
                          className={`hover:bg-sky-100 cursor-pointer flex justify-between items-center p-2 rounded ${
                            selectedPlayerKey === `${idx}-${player.position}-${player.isOnBench ? 'bench' : 'field'}`
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-white'
                          } ${isPendingTransfer(player) ? 'opacity-50' : ''}`}
                          onClick={(e) => {if(!isPendingTransfer(player)) selectPlayerToReplace(player)
                          setSelectedPlayerKey(`${idx}-${player.position}-${player.isOnBench ? 'bench' : 'field'}`
                            
                          );
                          
                        }}
                        >
                          <div className="flex items-center">
                            <span className="mr-1 text-xs bg-gray-200 text-gray-800 rounded px-1">
                              BENCH
                            </span>
                            {player.isCaptain && (
                              <span className="mr-1 text-xs bg-yellow-400 text-white rounded-full w-4 h-4 inline-flex items-center justify-center">
                                C
                              </span>
                            )}
                            {player.isViceCaptain && (
                              <span className="mr-1 text-xs bg-gray-400 text-white rounded-full w-4 h-4 inline-flex items-center justify-center">
                                V
                              </span>
                            )}
                            <span className='text-black'>{playerObj.name}</span>
                          </div>
                          <div className="text-sm text-gray-500">£{playerObj.price.toFixed(1)}m</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Available Players - Middle Column */}
            <div className="col-span-1 lg:col-span-2">
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-3">Available Players</h4>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-black"
                      placeholder="Player or club name"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <div className="flex space-x-2">
                      <button
                        className={`px-3 py-1 text-sm rounded ${
                          selectedPosition === 'All'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        onClick={() => handlePositionChange('All')}
                      >
                        All
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded ${
                          selectedPosition === 'GK'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        onClick={() => handlePositionChange('GK')}
                      >
                        GK
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded ${
                          selectedPosition === 'DEF'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        onClick={() => handlePositionChange('DEF')}
                      >
                        DEF
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded ${
                          selectedPosition === 'MID'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        onClick={() => handlePositionChange('MID')}
                      >
                        MID
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded ${
                          selectedPosition === 'FWD'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        onClick={() => handlePositionChange('FWD')}
                      >
                        FWD
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (max £{priceRange[1]}m)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={priceRange[1]}
                      onChange={handlePriceRangeChange}
                      className="block w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Sort By</label>
                    <div className="flex">
                      <select
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none text-black"
                        value={sortBy}
                        onChange={handleSortChange}
                      >
                        <option value="totalPoints">Points</option>
                        <option value="price">Price</option>
                        <option value="form">Form</option>
                        <option value="name">Name</option>
                      </select>
                      <button
                        onClick={toggleSortOrder}
                        className="cursor-pointer px-3 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md text-black"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Players List */}
                <div className="bg-white overflow-hidden border border-gray-200 sm:rounded-md">
                  {filteredPlayers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No players found matching your criteria
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {filteredPlayers.slice(0, 100).map((player) => (
                        <li
                          key={player.id}
                          className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                            selectedPlayer && selectedPlayer.id === player.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => selectPlayer(player)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs text-gray-800 mr-2">
                                  {player.position}
                                </span>
                                <span className="font-medium text-black">{player.name}</span>
                              </div>
                              <div className="text-sm text-gray-500">{player.club}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-black">£{player.price.toFixed(1)}m</div>
                              <div className="text-sm text-gray-500">{player.totalPoints} pts</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Transfer Action Section */}
              {selectedPlayer && playerToReplace && typeof playerToReplace.player === 'object' && (
                <div className="bg-white p-4 rounded border border-gray-200 mb-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Transfer Preview</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-3 rounded border border-red-100">
                      <h5 className="text-sm font-medium text-red-700 mb-2">Player Out</h5>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-black">{playerToReplace.player.name}</div>
                          <div className="text-sm text-black">{playerToReplace.player.club}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-black">
                            £{playerToReplace.player.price.toFixed(1)}m
                          </div>
                          <div className="text-sm text-black">
                            {playerToReplace.player.totalPoints} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded border border-green-100">
                      <h5 className="text-sm font-medium text-green-700 mb-2">Player In</h5>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-black">{selectedPlayer.name}</div>
                          <div className="text-sm text-black">{selectedPlayer.club}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-black">
                            £{selectedPlayer.price.toFixed(1)}m
                          </div>
                          <div className="text-sm text-black">{selectedPlayer.totalPoints} pts</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-600">Price Difference: </span>
                      <span
                        className={
                          selectedPlayer.price > playerToReplace.player.price
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {selectedPlayer.price > playerToReplace.player.price ? '+' : '-'}
                        £{Math.abs(selectedPlayer.price - playerToReplace.player.price).toFixed(1)}m
                      </span>
                    </div>

                    <button
                      onClick={addTransfer}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add to Transfer List
                    </button>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <button
                      onClick={cancelSelection}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Deselect
                    </button>
                    <button
                      onClick={goBackToDashboard}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Transfers</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to make {pendingTransfers.length} transfer
                    {pendingTransfers.length > 1 ? 's' : ''}?
                  </p>
                  <div className="mt-4 border-t pt-4">
                    {pendingTransfers.map((transfer, index) => {
                      const outPlayer = typeof transfer.out.player === 'object' ? transfer.out.player : null;
                      return (
                        <div key={index} className="flex justify-between items-center mb-2 text-sm">
                          <span className="text-red-600">{outPlayer?.name} OUT</span>
                          <span className="text-green-600">{transfer.in.name} IN</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <p className="font-medium text-black">New Budget: £{calculateRemainingBudget().toFixed(1)}m</p>
                  </div>
                </div>
                <div className="items-center px-4 py-3 flex justify-between">
                  <button
                    onClick={cancelConfirmation}
                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processTransfers}
                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
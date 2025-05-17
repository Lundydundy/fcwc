'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import teamService from '@/utils/api/teamService';
import playerService from '@/utils/api/playerService';

interface Player {
  id: string;
  name: string;
  club: string;
  position: string;
  price: number;
  totalPoints: number;
}

// Update the TeamFormationOption interface to include a new property for required players
interface TeamFormationOption {
  name: string;
  value: string;
  positions: {
    GK: number;
    DEF: number;
    MID: number;
    FWD: number;
  };
}

// Keep formation definitions the same as they represent the starting lineup
const formations: TeamFormationOption[] = [
  { name: '4-4-2', value: '4-4-2', positions: { GK: 1, DEF: 4, MID: 4, FWD: 2 } },
  { name: '4-3-3', value: '4-3-3', positions: { GK: 1, DEF: 4, MID: 3, FWD: 3 } },
  { name: '3-5-2', value: '3-5-2', positions: { GK: 1, DEF: 3, MID: 5, FWD: 2 } },
  { name: '3-4-3', value: '3-4-3', positions: { GK: 1, DEF: 3, MID: 4, FWD: 3 } },
  { name: '5-3-2', value: '5-3-2', positions: { GK: 1, DEF: 5, MID: 3, FWD: 2 } },
];

// Define minimum required players per position for each team
const minRequiredPlayers = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3
};

export default function CreateTeam() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [formation, setFormation] = useState<string>('4-4-2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('GK');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableClubs, setAvailableClubs] = useState<string[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(100.0); // Default budget of 100m
  
  // Team players
  const [selectedPlayers, setSelectedPlayers] = useState<{
    [key: string]: Player[];
  }>({
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
    BENCH: []
  });

  // Get counts of players by position
  const getPositionCounts = () => {
    const counts = {
      GK: 0,
      DEF: 0,
      MID: 0,
      FWD: 0,
      BENCH: 0
    };
    
    // Count players in each position array
    Object.entries(selectedPlayers).forEach(([position, players]) => {
      counts[position as keyof typeof counts] = players.length;
    });
    
    return counts;
  };

  // Check if we have the minimum required players for a position
  const hasMinimumPlayersForPosition = (position: string) => {
    const counts = getPositionCounts();
    return counts[position as keyof typeof counts] >= minRequiredPlayers[position as keyof typeof minRequiredPlayers];
  };

  // Check if all position requirements are met
  const allPositionRequirementsMet = () => {
    return hasMinimumPlayersForPosition('GK') && 
           hasMinimumPlayersForPosition('DEF') && 
           hasMinimumPlayersForPosition('MID') && 
           hasMinimumPlayersForPosition('FWD');
  };

  // Calculate remaining budget
  const getRemainingBudget = () => {
    const allPlayers = Object.values(selectedPlayers).flat();
    const spentBudget = allPlayers.reduce((total, player) => total + player.price, 0);
    return totalBudget - spentBudget;
  };

  // Get current formation requirements
  const getCurrentFormation = () => {
    return formations.find(f => f.value === formation) || formations[0];
  };

  // Load available players and clubs separately
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load players and clubs in parallel for better performance
        const [playersResponse, clubsResponse] = await Promise.all([
          playerService.getAllPlayers(),
          playerService.getAllClubs()
        ]);
        
        setAvailablePlayers(playersResponse);
        setAvailableClubs(clubsResponse);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter players by position, club, and search term
  useEffect(() => {
    if (!availablePlayers.length) return;

    let filtered = availablePlayers;

    // Filter by position if selected
    if (selectedPosition) {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    // Filter by club if selected
    if (selectedClub) {
      filtered = filtered.filter(player => player.club === selectedClub);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.club.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Remove already selected players
    const allSelectedIds = Object.values(selectedPlayers)
      .flat()
      .map(p => p.id);

    filtered = filtered.filter(player => !allSelectedIds.includes(player.id));

    // Sort by price
    filtered.sort((a, b) => b.price - a.price);

    setFilteredPlayers(filtered);
  }, [availablePlayers, selectedPosition, selectedClub, searchTerm, selectedPlayers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePositionSelect = (position: string) => {
    setSelectedPosition(position);
  };

  const handleClubSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClub(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedClub('');
    setSearchTerm('');
  };

  const handlePlayerSelect = (player: Player) => {
    const formationReqs = getCurrentFormation().positions;
    const currentCount = selectedPlayers[player.position].length;

    const totalSelected = Object.values(selectedPlayers).flat().length;
    if (totalSelected >= 15) {
      setError('You can only select 15 players');
      return;
    }

    if (currentCount >= formationReqs[player.position as keyof typeof formationReqs]) {
      if (selectedPlayers.BENCH.length < 4) {
        setSelectedPlayers(prev => ({
          ...prev,
          BENCH: [...prev.BENCH, player]
        }));
      } else {
        setError(`You can only have ${formationReqs[player.position as keyof typeof formationReqs]} ${player.position} players in your starting lineup and your bench is full`);
      }
    } else {
      setSelectedPlayers(prev => ({
        ...prev,
        [player.position]: [...prev[player.position], player]
      }));
    }
  };

  const handlePlayerRemove = (player: Player, fromBench: boolean = false) => {
    if (fromBench) {
      setSelectedPlayers(prev => ({
        ...prev,
        BENCH: prev.BENCH.filter(p => p.id !== player.id)
      }));
    } else {
      setSelectedPlayers(prev => ({
        ...prev,
        [player.position]: prev[player.position].filter(p => p.id !== player.id)
      }));
    }
  };

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormation = e.target.value;
    setFormation(newFormation);

    setSelectedPlayers({
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
      BENCH: []
    });
  };

  const handleCreateTeam = async () => {
    try {
      setLoading(true);
      setError('');

      const teamResponse = await teamService.createTeam({
        name: teamName,
        formation
      });

      const allPlayers = [
        ...selectedPlayers.GK.map(p => ({ player: p.id, position: p.position, isOnBench: false })),
        ...selectedPlayers.DEF.map(p => ({ player: p.id, position: p.position, isOnBench: false })),
        ...selectedPlayers.MID.map(p => ({ player: p.id, position: p.position, isOnBench: false })),
        ...selectedPlayers.FWD.map(p => ({ player: p.id, position: p.position, isOnBench: false })),
        ...selectedPlayers.BENCH.map(p => ({ player: p.id, position: p.position, isOnBench: true })),
      ];      await teamService.addPlayers({ players: allPlayers });

      // Update team info in all leagues the user has joined
      const leagueService = (await import('@/utils/api/leagueService')).default;
      await leagueService.updateTeamInLeagues();

      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Failed to create team');
      setLoading(false);
    }
  };

  const isTeamComplete = () => {
    const formationReqs = getCurrentFormation().positions;
    
    // Check that the minimum required players for each position are met
    const hasMinimumPlayers = 
      selectedPlayers.GK.length + selectedPlayers.BENCH.filter(p => p.position === 'GK').length >= minRequiredPlayers.GK &&
      selectedPlayers.DEF.length + selectedPlayers.BENCH.filter(p => p.position === 'DEF').length >= minRequiredPlayers.DEF &&
      selectedPlayers.MID.length + selectedPlayers.BENCH.filter(p => p.position === 'MID').length >= minRequiredPlayers.MID &&
      selectedPlayers.FWD.length + selectedPlayers.BENCH.filter(p => p.position === 'FWD').length >= minRequiredPlayers.FWD;
    
    // Check that the starting lineup matches the formation
    const hasFormationPlayers = 
      selectedPlayers.GK.length === formationReqs.GK &&
      selectedPlayers.DEF.length === formationReqs.DEF &&
      selectedPlayers.MID.length === formationReqs.MID &&
      selectedPlayers.FWD.length === formationReqs.FWD;
    
    // Check that the total number of players is 15 (11 starters + 4 bench)
    const hasFifteenPlayers = Object.values(selectedPlayers).flat().length === 15;
    
    return hasMinimumPlayers && hasFormationPlayers && hasFifteenPlayers;
  };

  const renderStep1 = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Name Your Team</h2>

      <div className="mb-6">
        <label htmlFor="teamName" className="block text-sm font-medium text-gray-800 mb-2">
          Team Name
        </label>
        <input
          type="text"
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Enter your team name"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="formation" className="block text-sm font-medium text-gray-800 mb-2">
          Formation
        </label>
        <select
          id="formation"
          value={formation}
          onChange={handleFormationChange}
          className="w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {formations.map((f) => (
            <option key={f.value} value={f.value}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!teamName.trim()}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${!teamName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Next: Select Players
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Select Your Players</h2>
          <div className="flex items-center">
            <div className={`text-lg font-semibold mr-3 ${getRemainingBudget() < 0 ? 'text-red-600' : 'text-green-600'}`}>
              Budget: £{getRemainingBudget().toFixed(1)}m
            </div>
            <div className="text-sm text-gray-500">
              Formation: {formation}
            </div>
          </div>
        </div>

        {/* Position Requirements Summary */}
        <div className="mb-4 p-4 bg-gray-100 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Position Requirements</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className={`p-2 rounded ${hasMinimumPlayersForPosition('GK') ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div className="font-medium">Goalkeepers</div>
              <div>{getPositionCounts().GK}</div>
            </div>
            <div className={`p-2 rounded ${hasMinimumPlayersForPosition('DEF') ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div className="font-medium">Defenders</div>
              <div>{getPositionCounts().DEF}</div>
            </div>
            <div className={`p-2 rounded ${hasMinimumPlayersForPosition('MID') ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div className="font-medium">Midfielders</div>
              <div>{getPositionCounts().MID}</div>
            </div>
            <div className={`p-2 rounded ${hasMinimumPlayersForPosition('FWD') ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div className="font-medium">Forwards</div>
              <div>{getPositionCounts().FWD}</div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>Each team must have at least {minRequiredPlayers.GK} goalkeepers, {minRequiredPlayers.DEF} defenders, {minRequiredPlayers.MID} midfielders, and {minRequiredPlayers.FWD} forwards.</p>
          </div>
        </div>

        {/* Position filters */}
        <div className="flex space-x-2 mb-4">
          {['GK', 'DEF', 'MID', 'FWD'].map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionSelect(pos)}
              className={`px-3 py-1 rounded-md ${selectedPosition === pos ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {pos} ({getPositionCounts()[pos as keyof ReturnType<typeof getPositionCounts>]})
            </button>
          ))}
          <button
            onClick={() => handlePositionSelect('BENCH')}
            className={`px-3 py-1 rounded-md ${selectedPosition === 'BENCH' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            BENCH ({getPositionCounts().BENCH})
          </button>
        </div>

        {/* Advanced filtering options */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Club filter */}
          <div>
            <label htmlFor="club-filter" className="block text-sm font-medium text-gray-800 mb-1">
              Filter by Club
            </label>
            <select
              id="club-filter"
              value={selectedClub}
              onChange={handleClubSelect}
              className="w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Clubs</option>
              {availableClubs.map(club => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search filter */}
          <div>
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-800 mb-1">
              Search Players
            </label>
            <input
              id="search-filter"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Player name..."
              className="w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          {/* Clear filters button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-400 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter stats */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredPlayers.length} players
          {selectedPosition !== 'BENCH' ? ` in position ${selectedPosition}` : ''}
          {selectedClub ? ` from ${selectedClub}` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Available players list */}
        <div className="mb-6 max-h-64 overflow-y-auto rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-6 text-center">Loading players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-6 text-center">
              No players found matching your criteria.
              {(selectedClub || searchTerm) && (
                <div className="mt-2">
                  <button
                    onClick={handleClearFilters}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Club</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{player.club}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{player.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">£{player.price}m</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{player.totalPoints}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handlePlayerSelect(player)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected squad summary with remove capability */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-gray-900">Your Squad</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Goalkeepers */}
            <div className="border-b pb-2">
              <h4 className="font-semibold text-sm mb-1 text-gray-800">Goalkeepers</h4>
              <div className="space-y-1">
                {selectedPlayers.GK.length > 0 ? (
                  selectedPlayers.GK.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-md text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.club} · £{player.price}m</div>
                      </div>
                      <button 
                        onClick={() => handlePlayerRemove(player)} 
                        className="text-red-600 hover:text-red-800"
                        title="Remove player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No goalkeepers selected</div>
                )}
              </div>
            </div>
            
            {/* Defenders */}
            <div className="border-b pb-2">
              <h4 className="font-semibold text-sm mb-1 text-gray-800">Defenders</h4>
              <div className="space-y-1">
                {selectedPlayers.DEF.length > 0 ? (
                  selectedPlayers.DEF.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-md text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.club} · £{player.price}m</div>
                      </div>
                      <button 
                        onClick={() => handlePlayerRemove(player)} 
                        className="text-red-600 hover:text-red-800"
                        title="Remove player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No defenders selected</div>
                )}
              </div>
            </div>
            
            {/* Midfielders */}
            <div className="border-b pb-2">
              <h4 className="font-semibold text-sm mb-1 text-gray-800">Midfielders</h4>
              <div className="space-y-1">
                {selectedPlayers.MID.length > 0 ? (
                  selectedPlayers.MID.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-md text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.club} · £{player.price}m</div>
                      </div>
                      <button 
                        onClick={() => handlePlayerRemove(player)} 
                        className="text-red-600 hover:text-red-800"
                        title="Remove player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No midfielders selected</div>
                )}
              </div>
            </div>
            
            {/* Forwards */}
            <div className="border-b pb-2">
              <h4 className="font-semibold text-sm mb-1 text-gray-800">Forwards</h4>
              <div className="space-y-1">
                {selectedPlayers.FWD.length > 0 ? (
                  selectedPlayers.FWD.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-md text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.club} · £{player.price}m</div>
                      </div>
                      <button 
                        onClick={() => handlePlayerRemove(player)} 
                        className="text-red-600 hover:text-red-800"
                        title="Remove player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No forwards selected</div>
                )}
              </div>
            </div>
            
            {/* Bench */}
            <div>
              <h4 className="font-semibold text-sm mb-1 text-gray-800">Bench</h4>
              <div className="space-y-1">
                {selectedPlayers.BENCH.length > 0 ? (
                  selectedPlayers.BENCH.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-md text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.club} · {player.position} · £{player.price}m</div>
                      </div>
                      <button 
                        onClick={() => handlePlayerRemove(player, true)} 
                        className="text-red-600 hover:text-red-800"
                        title="Remove player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No bench players selected</div>
                )}
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total players: {Object.values(selectedPlayers).flat().length}/15</span>
                <span className={`text-sm font-medium ${getRemainingBudget() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Budget: £{getRemainingBudget().toFixed(1)}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200">
        <div className="flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Back
          </button>

          <button
            onClick={handleCreateTeam}
            disabled={!isTeamComplete() || loading}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${(!isTeamComplete() || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Your Fantasy Team</h1>

      {step === 1 ? renderStep1() : renderStep2()}
    </div>
  );
}
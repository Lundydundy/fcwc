'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/utils/context/AuthContext';
import leagueService, { League } from '@/utils/api/leagueService';

export default function LeaguesPage() {
  console.log('[DEBUG] LeaguesPage component mounted');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLeagueModal, setCreateLeagueModal] = useState(false);
  const [joinLeagueModal, setJoinLeagueModal] = useState(false);  const [leagueFormData, setLeagueFormData] = useState({
    name: '',
    description: '',
    type: 'private',
    maxMembers: 20
  });
  const [inviteCode, setInviteCode] = useState('');
  const [formError, setFormError] = useState('');
  const { user } = useAuth();

  // New state for all public leagues
  const [allPublicLeagues, setAllPublicLeagues] = useState<League[]>([]);
  const [allPublicLeaguesLoading, setAllPublicLeaguesLoading] = useState(false);
  const [publicLeaguesError, setPublicLeaguesError] = useState<string | null>(null);

  // Add state for join loading and error for public leagues
  const [joiningLeagueId, setJoiningLeagueId] = useState<string | null>(null);
  const [joinPublicError, setJoinPublicError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        setLoading(true);
        console.log('[DEBUG] Loading leagues...');
        const response = await leagueService.getJoinedLeagues();
        console.log('[DEBUG] getJoinedLeagues response:', response);
        if (response.success && response.data) {
          setLeagues(response.data);
          console.log('[DEBUG] setLeagues with:', response.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('[DEBUG] Failed to load leagues:', error);
        setLoading(false);
      }
    };
    
    loadLeagues();
  }, []);

  // Fetch all public leagues on mount
  useEffect(() => {
    const fetchAllPublicLeagues = async () => {
      setAllPublicLeaguesLoading(true);
      setPublicLeaguesError(null);
      try {
        const res = await leagueService.getAllPublicLeagues(1, 50, '');
        console.log('[DEBUG] Fetched public leagues response:', res);
        if (res.success && res.data) {
          setAllPublicLeagues(res.data);
        } else {
          setAllPublicLeagues([]);
          setPublicLeaguesError(res.message || 'Failed to fetch public leagues.');
          console.error('[DEBUG] Public leagues fetch unsuccessful:', res);
        }
      } catch (e) {
        setAllPublicLeagues([]);
        setPublicLeaguesError('Error fetching public leagues.');
        console.error('[DEBUG] Error fetching public leagues:', e);
      }
      setAllPublicLeaguesLoading(false);
    };
    fetchAllPublicLeagues();
  }, []);

  const handleCreateLeague = async () => {
    try {
      setFormError('');
      // Validate form data
      if (!leagueFormData.name) {
        setFormError('League name is required');
        return;
      }      if (leagueFormData.maxMembers < 2) {
        setFormError('Max members must be at least 2');
        return;
      }
      
      // Create league API call
      const response = await leagueService.createLeague(leagueFormData);
      if (response.success) {
        setCreateLeagueModal(false);
        setLeagueFormData({ name: '', description: '', type: 'private', maxMembers: 20 });
        // Refetch leagues to include the newly created league
        const updatedResponse = await leagueService.getJoinedLeagues();
        if (updatedResponse.success && updatedResponse.data) {
          setLeagues(updatedResponse.data);
        }
      } else {
        setFormError(response.message || 'Failed to create league');
      }
    } catch (error) {
      setFormError('An error occurred while creating the league');
      console.error(error);
    }
  };

  const handleJoinLeague = async () => {
    try {
      setFormError('');
      // Validate invite code
      if (!inviteCode) {
        setFormError('Invite code is required');
        return;
      }
      
      // Join league API call
      const response = await leagueService.joinLeague(inviteCode);
      if (response.success) {
        setJoinLeagueModal(false);
        setInviteCode('');
        // Refetch leagues to include the newly joined league
        const updatedResponse = await leagueService.getJoinedLeagues();
        if (updatedResponse.success && updatedResponse.data) {
          setLeagues(updatedResponse.data);
        }
      } else {
        setFormError(response.message || 'Failed to join league');
      }
    } catch (error) {
      setFormError('An error occurred while joining the league');
      console.error(error);
    }
  };

  // Helper: check if user is a member of a league
  const isUserInLeague = (league: League) => {
    if (!user) return false;
    if (Array.isArray(league.members)) {
      return league.members.some((m: any) => (typeof m === 'object' ? m._id : m) === user.id);
    }
    return false;
  };

  // Handler to join a public league
  const handleJoinPublicLeague = async (leagueId: string) => {
    setJoiningLeagueId(leagueId);
    setJoinPublicError(null);
    try {
      const response = await leagueService.joinPublicLeague(leagueId);
      if (response.success) {
        // Refetch user's leagues
        const updatedResponse = await leagueService.getJoinedLeagues();
        if (updatedResponse.success && updatedResponse.data) {
          setLeagues(updatedResponse.data);
        }
      } else {
        setJoinPublicError(response.message || 'Failed to join public league.');
      }
    } catch (e) {
      setJoinPublicError('Error joining public league.');
    }
    setJoiningLeagueId(null);
  };

  // Filter public leagues to only those NOT already in the user's leagues list (by _id)
  const userLeagueIds = new Set(leagues.map(l => l._id));
  const publicLeaguesToShow = allPublicLeagues.filter(
    (league) => !userLeagueIds.has(league._id)
  );

  console.log('[DEBUG] Leagues state:', leagues);
  console.log('[DEBUG] All Public Leagues:', allPublicLeagues);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Leagues</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your league memberships and create or join leagues.
          </p>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading leagues...</p>
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">
            {/* User's Leagues */}
            <h4 className="text-md font-medium text-gray-700 mb-4">Your Leagues</h4>
            <div className="space-y-4 mb-8">
              {leagues.length > 0 ? (
                leagues.map(league => (
                  <div key={league._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-medium text-gray-900">{league.name}</div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {league.type === 'public' ? 'Public' : 'Private'}
                      </div>
                    </div>
                    {league.description && (
                      <div className="mt-2 text-sm text-gray-500">
                        {league.description}
                      </div>
                    )}
                    <div className="mt-3 flex justify-between items-center">                      <div className="text-sm text-gray-500">
                        Created by: {(typeof league.owner === 'object' ? league.owner._id : league.owner) === user?.id 
                          ? 'You' 
                          : (typeof league.owner === 'object' && league.owner.name ? league.owner.name : 'Another user')}
                      </div>
                      <Link 
                        href={`/dashboard/leagues/${league._id}`}
                        className="text-sm font-medium text-green-600 hover:text-green-500"
                      >
                        View League
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">You are not a member of any leagues yet.</p>
              )}
            </div>
            
            {/* Create or Join League buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setCreateLeagueModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create League
              </button>
              <button
                onClick={() => setJoinLeagueModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join League
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create League Modal */}
      {createLeagueModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex">
          <div className="relative p-8 bg-white rounded-lg shadow-md max-w-lg w-full m-auto">
            <h2 className="text-xl font-bold mb-4">Create a New League</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leagueName">
                League Name
              </label>
              <input
                type="text"
                id="leagueName"
                value={leagueFormData.name}
                onChange={(e) => setLeagueFormData({ ...leagueFormData, name: e.target.value })}
                className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                placeholder="Enter league name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leagueDescription">
                Description
              </label>
              <textarea
                id="leagueDescription"
                value={leagueFormData.description}
                onChange={(e) => setLeagueFormData({ ...leagueFormData, description: e.target.value })}
                className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                placeholder="Enter a brief description of the league"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leagueType">
                League Type
              </label>
              <select
                id="leagueType"                value={leagueFormData.type}
                onChange={(e) => setLeagueFormData({ 
                  ...leagueFormData, 
                  type: e.target.value
                })}
                className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="maxMembers">
                Max Members
              </label>
              <input
                type="number"
                id="maxMembers"
                value={leagueFormData.maxMembers}
                onChange={(e) => setLeagueFormData({ ...leagueFormData, maxMembers: Number(e.target.value) })}
                className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                placeholder="Enter maximum number of members"
                min={2}
                max={100}
              />
            </div>

            {formError && (
              <div className="mb-4 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCreateLeagueModal(false)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLeague}
                className="inline-flex items-center px-4 py-2 border border-transparent textsm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create League
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join League Modal */}
      {joinLeagueModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex">
          <div className="relative p-8 bg-white rounded-lg shadow-md max-w-lg w-full m-auto">
            <h2 className="text-xl font-bold mb-4">Join a League</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inviteCode">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                placeholder="Enter the invite code for the league"
              />
            </div>

            {formError && (
              <div className="mb-4 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setJoinLeagueModal(false)}
                className="inline-flex items-center px-4 py-2 border border-transparent textsm font-medium rounded-md shadow-sm text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinLeague}
                className="inline-flex items-center px-4 py-2 border border-transparent textsm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join League
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Public Leagues Section (visible to all users) */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Public Leagues</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Browse all public leagues. You do not need to be logged in to view this list.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {publicLeaguesError && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
              {publicLeaguesError}
            </div>
          )}
          {allPublicLeaguesLoading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Loading public leagues...</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {publicLeaguesToShow.length > 0 ? (
                publicLeaguesToShow.map(league => (
                  <div key={league._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-medium text-gray-900">{league.name}</div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Public</div>
                    </div>
                    {league.description && (
                      <div className="mt-2 text-sm text-gray-500">{league.description}</div>
                    )}
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Created by: {typeof league.owner === 'object' && league.owner.name ? league.owner.name : 'Another user'}
                      </div>
                      {user ? (
                        <button
                          className="text-sm font-medium text-green-600 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={joiningLeagueId === league._id}
                          onClick={() => handleJoinPublicLeague(league._id)}
                        >
                          {joiningLeagueId === league._id ? 'Joining...' : 'Join League'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Login to join</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No public leagues found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import leagueService, { League } from '@/utils/api/leagueService';

interface LeaguesTabProps {
  user: any;
}

interface LeaguesResponse {
  success: boolean;
  data: League[];
  count?: number;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function LeaguesTab({ user }: LeaguesTabProps) {
  console.log('[DEBUG] LeaguesTab component mounted');
  
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [createLeagueModal, setCreateLeagueModal] = useState(false);
  const [joinLeagueModal, setJoinLeagueModal] = useState(false);
  const [leagueFormData, setLeagueFormData] = useState({
    name: '',
    description: '',
    type: 'private',
    maxMembers: 20
  });
  const [inviteCode, setInviteCode] = useState('');
  const [formError, setFormError] = useState('');

  // New states for public leagues
  const [allPublicLeagues, setAllPublicLeagues] = useState<League[]>([]);
  const [allPublicLeaguesLoading, setAllPublicLeaguesLoading] = useState(false);
  const [publicSearch, setPublicSearch] = useState('');
  const [publicPage, setPublicPage] = useState(1);
  const [publicPagination, setPublicPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  // New state for public leagues fetch error
  type PublicLeaguesError = string | null;
  const [publicLeaguesError, setPublicLeaguesError] = useState<PublicLeaguesError>(null);

  // Load leagues data when the component mounts
  useEffect(() => {
    const loadLeagues = async () => {
      try {
        setLeaguesLoading(true);
        const response = await leagueService.getJoinedLeagues();
        if (response.success && response.data) {
          setLeagues(response.data);
        }
        setLeaguesLoading(false);
      } catch (error) {
        console.error('Failed to load leagues:', error);
        setLeaguesLoading(false);
      }
    };
    
    loadLeagues();
  }, []);

  // Fetch all public leagues
  useEffect(() => {
    const fetchAllPublicLeagues = async () => {
      setAllPublicLeaguesLoading(true);
      setPublicLeaguesError(null);
      try {
        const res: LeaguesResponse = await leagueService.getAllPublicLeagues(publicPage, 50, publicSearch);
        console.log('[DEBUG] Fetched public leagues response:', res); // DEBUG LOG
        if (res.success && res.data) {
          setAllPublicLeagues(res.data);
          if (res.pagination) setPublicPagination(res.pagination);
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
  }, [publicPage, publicSearch]);

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
        const updatedLeagues = await leagueService.getJoinedLeagues();
        if (updatedLeagues.success && updatedLeagues.data) {
          setLeagues(updatedLeagues.data);
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
        const updatedLeagues = await leagueService.getJoinedLeagues();
        if (updatedLeagues.success && updatedLeagues.data) {
          setLeagues(updatedLeagues.data);
        }
      } else {
        setFormError(response.message || 'Failed to join league');
      }
    } catch (error) {
      setFormError('An error occurred while joining the league');
      console.error(error);
    }
  };

  console.log('[DEBUG] Leagues:', leagues); // DEBUG LOG
  console.log('[DEBUG] All Public Leagues:', allPublicLeagues); // DEBUG LOG

  return (
    <div className="min-h-screen bg-gray-100 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Leagues</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage your league memberships and create or join leagues.
            </p>
          </div>
          
          {leaguesLoading ? (
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
                        <div className="text-lg font-medium text-gray-900">{league.name}</div>                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
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
                        <button
                          className="text-sm font-medium text-green-600 hover:text-green-500"
                          onClick={() => {/* Optionally open a modal or show details, but do NOT navigate */}}
                        >
                          View League
                        </button>
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

        {/* All Public Leagues Section (visible to all users) */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
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
            <form onSubmit={e => { e.preventDefault(); setPublicPage(1); }} className="flex mb-6">
              <input
                type="text"
                placeholder="Search public leagues by name..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={publicSearch}
                onChange={e => setPublicSearch(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Search
              </button>
            </form>
            {allPublicLeaguesLoading ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">Loading public leagues...</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {allPublicLeagues.length > 0 ? (
                  allPublicLeagues.map(league => (
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
                        <button
                          className="text-sm font-medium text-green-600 hover:text-green-500"
                          onClick={() => {/* Optionally open a modal or show details, but do NOT navigate */}}
                        >
                          View League
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No public leagues found.</p>
                )}
              </div>
            )}
            {/* Pagination for public leagues */}
            {publicPagination.pages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setPublicPage(prev => Math.max(prev - 1, 1))}
                    disabled={publicPage === 1}
                    className={`px-2 py-1 rounded ${publicPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                  >Previous</button>
                  {Array.from({ length: Math.min(5, publicPagination.pages) }, (_, i) => {
                    let pageToShow = publicPage - 2 + i;
                    if (publicPage < 3) pageToShow = i + 1;
                    else if (publicPage > publicPagination.pages - 2) pageToShow = publicPagination.pages - 4 + i;
                    if (pageToShow > 0 && pageToShow <= publicPagination.pages) {
                      return (
                        <button
                          key={pageToShow}
                          onClick={() => setPublicPage(pageToShow)}
                          className={`px-3 py-1 rounded text-sm font-medium ${pageToShow === publicPage ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {pageToShow}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setPublicPage(prev => Math.min(prev + 1, publicPagination.pages))}
                    disabled={publicPage === publicPagination.pages}
                    className={`px-2 py-1 rounded ${publicPage === publicPagination.pages ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                  >Next</button>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Create League Modal */}
        {createLeagueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create a New League</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the details below to create a new league.
                </p>
              </div>
              <div className="border-t">
                <div className="px-4 py-5 sm:px-6">
                  {formError && (
                    <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-y-4">
                    <div>
                      <label htmlFor="league-name" className="block text-sm font-medium text-gray-700">
                        League Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="league-name"
                          type="text"
                          value={leagueFormData.name}
                          onChange={e => setLeagueFormData({ ...leagueFormData, name: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter league name"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="league-description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="league-description"
                          value={leagueFormData.description}
                          onChange={e => setLeagueFormData({ ...leagueFormData, description: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter league description"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="league-type" className="block text-sm font-medium text-gray-700">
                        League Type
                      </label>
                      <div className="mt-1">
                        <select
                          id="league-type"
                          value={leagueFormData.type}
                          onChange={e => setLeagueFormData({ ...leagueFormData, type: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="max-members" className="block text-sm font-medium text-gray-700">
                        Max Members
                      </label>
                      <div className="mt-1">
                        <input
                          id="max-members"
                          type="number"
                          value={leagueFormData.maxMembers}
                          onChange={e => setLeagueFormData({ ...leagueFormData, maxMembers: Number(e.target.value) })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter max number of members"
                          min={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setCreateLeagueModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLeague}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Create League
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join League Modal */}
        {joinLeagueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Join a League</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the invite code to join an existing league.
                </p>
              </div>
              <div className="border-t">
                <div className="px-4 py-5 sm:px-6">
                  {formError && (
                    <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-y-4">
                    <div>
                      <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
                        Invite Code
                      </label>
                      <div className="mt-1">
                        <input
                          id="invite-code"
                          type="text"
                          value={inviteCode}
                          onChange={e => setInviteCode(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter invite code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setJoinLeagueModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinLeague}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Join League
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

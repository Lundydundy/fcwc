'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/context/AuthContext';
import leagueService from '@/utils/api/leagueService';

interface League {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  type: string;
  maxMembers?: number;
  members?: Member[];
  inviteCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Member {
  user: {
    _id: string;
    name: string;
  };
  team?: {
    _id: string;
    name: string;
    totalPoints: number;
  };
  joinedAt: string;
}

export default function LeagueDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [leaveLeagueConfirm, setLeaveLeagueConfirm] = useState(false);
  useEffect(() => {
    const loadLeague = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to update the team info in all leagues to ensure it's current
        try {
          await leagueService.updateTeamInLeagues();
        } catch (updateError) {
          console.error('Failed to update team info:', updateError);
          // Continue with loading the league even if the update fails
        }
        
        // Fetch league details
        const response = await leagueService.getLeagueDetails(id as string);
        
        if (response.success && response.data) {
          setLeague(response.data);
          if (response.data.members) {
            setMembers(response.data.members);
          }
        } else {
          setError(response.message || 'Failed to load league details');
        }
        
        setLoading(false);
      } catch (error) {
        setError('An error occurred while loading the league');
        setLoading(false);
        console.error('League details fetch error:', error);
      }
    };

    if (id) {
      loadLeague();
    }
  }, [id]);

  const handleCopyInviteCode = () => {
    if (league?.inviteCode) {
      navigator.clipboard.writeText(league.inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleLeaveLeague = async () => {
    try {
      if (!league?._id) return;
      
      const response = await leagueService.leaveLeague(league._id);
      
      if (response.success) {
        router.push('/dashboard/leagues');
      } else {
        setError(response.message || 'Failed to leave league');
      }
    } catch (error) {
      setError('An error occurred while leaving the league');
      console.error('Leave league error:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-500">Loading league details...</p>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error || 'League not found'}</p>
          <Link
            href="/dashboard/leagues"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Back to Leagues
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = (typeof league.owner === 'object' ? league.owner._id : league.owner) === user?.id;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{league.name}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {league.type === 'public' ? 'Public League' : 'Private League'} • 
              Created by: {isOwner 
                ? 'You' 
                : (typeof league.owner === 'object' && league.owner.name ? league.owner.name : 'Another user')} • 
              Created {new Date(league.createdAt || '').toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/leagues"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Back to Leagues
            </Link>
            {!isOwner && (
              <button
                onClick={() => setLeaveLeagueConfirm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Leave League
              </button>
            )}
          </div>
        </div>
        
        {league.description && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-sm text-gray-600">{league.description}</p>
          </div>
        )}
        
        {/* Invite Code Section - Only visible to the owner */}
        {isOwner && league.inviteCode && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Invite Code</h4>
            <div className="flex items-center">
              <div className="bg-gray-100 rounded-l-md px-4 py-2 text-gray-700 font-mono">
                {league.inviteCode}
              </div>
              <button
                onClick={handleCopyInviteCode}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md"
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Share this code with others to invite them to join your league
            </p>
          </div>
        )}
        
        {/* League Standings */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">League Standings</h4>
          
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rank
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Manager
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Team
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members
                    .filter(m => m.team)
                    .sort((a, b) => (b.team?.totalPoints || 0) - (a.team?.totalPoints || 0))
                    .map((member, index) => (
                      <tr key={member.user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.user.name} {member.user._id === user?.id && '(You)'}
                        </td>                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.team?.name || 'No team'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          {member.team?.totalPoints || 0}
                        </td>
                      </tr>
                    ))}
                  
                  {/* Members without teams */}
                  {members
                    .filter(m => !m.team)
                    .map((member) => (
                      <tr key={member.user._id} className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {member.user.name} {member.user._id === user?.id && '(You)'}
                        </td>                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {member.user._id === user?.id ? (
                            <Link href="/dashboard/create-team" className="text-blue-500 hover:underline">
                              Create a team
                            </Link>
                          ) : (
                            'No team created'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-400">
                          0
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No members in this league yet.</p>
          )}
        </div>
      </div>

      {/* Leave League Confirmation Modal */}
      {leaveLeagueConfirm && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex">
          <div className="relative p-8 bg-white rounded-lg shadow-md max-w-md w-full m-auto">
            <h2 className="text-xl font-bold mb-4">Leave League</h2>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave this league? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setLeaveLeagueConfirm(false)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveLeague}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Leave League
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

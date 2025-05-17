'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/utils/context/AuthContext';
import teamService from '@/utils/api/teamService';
import matchService from '@/utils/api/matchService';
import leagueService from '@/utils/api/leagueService';

// Define TypeScript interfaces for our data
interface PlayerData {
  name: string;
  club: string;
  totalPoints: number;
  price: number;
}

interface TeamPlayer {
  player: PlayerData | string;
  position: string; // Changed from 'GK' | 'DEF' | 'MID' | 'FWD' to string to match API
  isOnBench: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  benchOrder?: number; // Order on the bench (0-based index)
}

interface TeamData {
  name: string;
  budget: number;
  formation: string;
  totalPoints: number;
  players: TeamPlayer[];
  nextDeadline?: string;
  points?: number;
}

interface MatchData {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  competition: string;
  stage: string;
  played: boolean;
  score?: {
    homeScore: number;
    awayScore: number;
  };
  venue?: string;
}

interface LeagueData {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    name: string;
  };
  type: 'public' | 'private';
  inviteCode?: string;
  members: {
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
  }[];
  maxMembers: number;
  createdAt: string;
}

interface LeagueData {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    name: string;
  };
  type: 'public' | 'private';
  inviteCode?: string;
  members: {
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
  }[];
  maxMembers: number;
  createdAt: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [leagues, setLeagues] = useState<LeagueData[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [createLeagueModal, setCreateLeagueModal] = useState(false);
  const [joinLeagueModal, setJoinLeagueModal] = useState(false);  const [leagueFormData, setLeagueFormData] = useState({
    name: '',
    description: '',
    type: 'private',
    maxMembers: 20
  });
  const [inviteCode, setInviteCode] = useState('');
  const [formError, setFormError] = useState('');
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check URL parameters for tab selection on component mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Check if user has a team and load team data
  useEffect(() => {
    const loadUserTeam = async () => {
      try {
        setTeamLoading(true);
        const response = await teamService.getUserTeam();
        setHasTeam(!!response);
        setTeamData(response);
        setTeamLoading(false);
      } catch (err) {
        setHasTeam(false);
        setTeamLoading(false);
      }
    };
    
    loadUserTeam();
  }, []);

  // Load match fixtures when the fixtures tab is active
  useEffect(() => {
    if (activeTab === 'fixtures') {
      const loadMatches = async () => {
        try {
          setMatchesLoading(true);
          const matchesData = await matchService.getAllMatches();
          console.log('Matches data:', matchesData);
          setMatches(matchesData);
          setMatchesLoading(false);
        } catch (error) {
          console.error('Failed to load matches:', error);
          setMatchesLoading(false);
        }
      };
      
      loadMatches();
      console.log(matches, 'Matches loaded');
    }
  }, [activeTab]);
  
  // Load leagues data when the leagues tab is active
  useEffect(() => {
    if (activeTab === 'leagues') {
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
    }
  }, [activeTab]);
  
  // Get user's initials for the avatar
  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close menu when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  };
  
  // Format date for fixtures display
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  
  // If user doesn't have a team yet, show create team CTA
  if (!teamLoading && !hasTeam) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/dashboard" className="text-xl font-bold text-green-700">
                    Fantasy Club World Cup
                  </Link>
                </div>
              </div>
              
              {/* User dropdown menu */}
              <div className="flex items-center">
                <div className="ml-3 relative">
                  <div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu();
                      }}
                      className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" 
                      id="user-menu" 
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                        {getInitials()}
                      </div>
                    </button>
                  </div>
                  
                  {menuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10" 
                      role="menu" 
                      aria-orientation="vertical" 
                      aria-labelledby="user-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        {user?.name}
                      </span>
                      <button 
                        onClick={handleLogout} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Fantasy Club World Cup!</h2>
            <p className="text-gray-600 mb-8">You have not created your team yet. Start your fantasy journey by creating your dream team!</p>
            <Link
              href="/dashboard/create-team"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create Your Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" onClick={handleClickOutside}>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-green-700">
                  Fantasy Club World Cup
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-4">Gameweek 1</span>
              <button className="bg-green-600 p-1 rounded-full text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              {/* User dropdown menu */}
              <div className="ml-3 relative">
                <div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu();
                    }}
                    className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" 
                    id="user-menu" 
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                      {getInitials()}
                    </div>
                  </button>
                </div>
                
                {/* Dropdown menu - now toggle-based instead of hover-based */}
                {menuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10" 
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="user-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      {user?.name}
                    </span>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Settings</a>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => {setActiveTab('overview')
                router.push('/dashboard');
              }}
              className={`${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              aria-current={activeTab === 'overview' ? 'page' : undefined}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('myTeam')}
              className={`${
                activeTab === 'myTeam'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              aria-current={activeTab === 'myTeam' ? 'page' : undefined}
            >
              My Team
            </button>
            <button
              onClick={() => {setActiveTab('transfers')
                router.push('/dashboard/transfers');
              }}
              className={`${
                activeTab === 'transfers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              aria-current={activeTab === 'transfers' ? 'page' : undefined}
            >
              Transfers
            </button>            <button
              onClick={() => {
                setActiveTab('leagues')
                router.push('/dashboard/leagues');}
              }
              className={`$${
                activeTab === 'leagues'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              aria-current={activeTab === 'leagues' ? 'page' : undefined}
            >
              Leagues
            </button>
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`${
                activeTab === 'fixtures'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              aria-current={activeTab === 'fixtures' ? 'page' : undefined}
            >
              Fixtures
            </button>
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Team Name
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {teamData?.name}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/dashboard?tab=myTeam" className="font-medium text-green-600 hover:text-green-500">
                      View team details
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Points
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {teamData?.points}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/dashboard/history" className="font-medium text-green-600 hover:text-green-500">
                      View points history
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Next Deadline
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-xl font-semibold text-gray-900">
                            {teamData?.nextDeadline}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/dashboard/transfers" className="font-medium text-green-600 hover:text-green-500">
                      Make transfers
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Team Tab Content */}
        {activeTab === 'myTeam' && (
          <div className="py-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {teamLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Loading your team...</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{teamData?.name}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Team value: £{(teamData?.budget || 0).toFixed(1)}m • 
                        Formation: {teamData?.formation} • 
                        Points: {teamData?.totalPoints || 0}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/dashboard/edit-formation')} 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Edit Formation
                    </button>
                  </div>

                  <div className="border-t border-gray-200">
                    <div className="bg-green-800 text-white px-4 py-3">
                      <div className="grid grid-cols-6 gap-4 text-sm font-medium">
                        <div>Player</div>
                        <div>Team</div>
                        <div>Position</div>
                        <div className="text-center">Points</div>
                        <div className="text-center">Captain</div>
                        <div className="text-right">Price</div>
                      </div>
                    </div>

                    {/* Main Squad */}
                    <div className="divide-y divide-gray-200">
                      <div className="px-4 py-2 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-500">Starting XI</h4>
                      </div>
                      {teamData?.players
                        ?.filter((p: TeamPlayer) => !p.isOnBench)
                        ?.sort((a: TeamPlayer, b: TeamPlayer) => {
                          const posOrder: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
                          return posOrder[a.position] - posOrder[b.position];
                        })
                        ?.map((player: TeamPlayer, idx: number) => (
                        <div key={idx} className="px-4 py-3">
                          <div className="grid grid-cols-6 gap-4">
                            <div className="font-medium text-gray-900">
                              {typeof player.player === 'object' ? player.player.name : 'Unknown Player'}
                            </div>
                            <div className="text-gray-500">
                              {typeof player.player === 'object' ? player.player.club : ''}
                            </div>
                            <div className="text-gray-500">
                              {player.position}
                            </div>
                            <div className="text-center text-gray-900">
                              {typeof player.player === 'object' ? player.player.totalPoints : 0}
                            </div>
                            <div className="text-center">
                              {player.isCaptain && 
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Captain
                                </span>
                              }
                              {player.isViceCaptain && 
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Vice
                                </span>
                              }
                            </div>
                            <div className="text-right text-gray-900">
                              £{typeof player.player === 'object' ? player.player.price : 0}m
                            </div>
                          </div>
                        </div>
                      ))}                      {/* Bench Players */}
                      <div className="px-4 py-2 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-500">Bench (Substitution Order)</h4>
                      </div>
                      {teamData?.players
                        ?.filter((p: TeamPlayer) => p.isOnBench)
                        ?.sort((a: TeamPlayer, b: TeamPlayer) => {
                          // If benchOrder is defined, use it
                          if (a.benchOrder !== undefined && b.benchOrder !== undefined) {
                            return a.benchOrder - b.benchOrder;
                          }
                          
                          // Otherwise, ensure goalkeepers come first, then sort by position
                          if (a.position === 'GK' && b.position !== 'GK') return -1;
                          if (a.position !== 'GK' && b.position === 'GK') return 1;
                          
                          const posOrder: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
                          return posOrder[a.position] - posOrder[b.position];
                        })
                        ?.map((player: TeamPlayer, idx: number) => (
                        <div key={idx} className="px-4 py-3 bg-gray-50/50">
                          <div className="grid grid-cols-6 gap-4">
                            <div className="font-medium text-gray-700">
                              {typeof player.player === 'object' ? player.player.name : 'Unknown Player'}
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full ${idx === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} title="Substitution order">
                                {idx === 0 ? '1st' : (idx === 1 ? '2nd' : (idx === 2 ? '3rd' : `${idx+1}th`))}
                              </span>
                            </div>
                            <div className="text-gray-500">
                              {typeof player.player === 'object' ? player.player.club : ''}
                            </div>
                            <div className="text-gray-500">
                              {player.position}
                            </div>
                            <div className="text-center text-gray-700">
                              {typeof player.player === 'object' ? player.player.totalPoints : 0}
                            </div>
                            <div className="text-center"></div>
                            <div className="text-right text-gray-700">
                              £{typeof player.player === 'object' ? player.player.price : 0}m
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Fixtures Tab Content */}
        {activeTab === 'fixtures' && (
          <div className="py-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Fixtures & Results</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Upcoming matches and recent results from the Club World Cup.
                </p>
              </div>
              
              {matchesLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Loading matches...</p>
                </div>
              ) : (
                <div className="px-4 py-5 sm:p-6">
                  {/* Upcoming Matches */}
                  <h4 className="text-md font-medium text-gray-700 mb-4">Upcoming Matches</h4>
                  <div className="space-y-4 mb-8">
                    {matches.filter(match => match.played === false).length > 0 ? (
                      matches
                        .filter(match => match.played === false)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(match => (
                          <div key={match._id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">{formatMatchDate(match.date) + " " + match.time}</div>
                              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {match.competition} - {match.stage}
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                              <div className="flex-1 text-right pr-3">
                                <div className="font-medium text-black">{match.homeTeam}</div>
                              </div>
                              <div className="px-3 py-1 bg-gray-100 rounded font-semibold text-gray-600">
                                vs
                              </div>
                              <div className="flex-1 text-left pl-3">
                                <div className="font-medium text-black">{match.awayTeam}</div>
                              </div>
                            </div>
                            {match.venue && (
                              <div className="mt-2 text-sm text-center text-gray-500">
                                {match.venue}
                              </div>
                            )}
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No upcoming matches scheduled.</p>
                    )}
                  </div>
                  
                  {/* Completed Matches */}
                  <h4 className="text-md font-medium text-gray-700 mb-4">Recent Results</h4>
                  <div className="space-y-4">
                    {matches.filter(match => match.played === true).length > 0 ? (
                      matches
                        .filter(match => match.played === true)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(match => (
                          <div key={match._id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">{formatMatchDate(match.date)}</div>
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {match.competition} - {match.stage}
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                              <div className="flex-1 text-right pr-3">
                                <div className="font-medium text-black">{match.homeTeam}</div>
                              </div>
                              {match.score ? (
                                <div className="px-3 py-1 bg-gray-100 rounded font-semibold">
                                  {match.score.homeScore} - {match.score.awayScore}
                                </div>
                              ) : (
                                <div className="px-3 py-1 bg-gray-100 rounded font-semibold">
                                  FT
                                </div>
                              )}
                              <div className="flex-1 text-left pl-3">
                                <div className="font-medium text-black">{match.awayTeam}</div>
                              </div>
                            </div>
                            {match.venue && (
                              <div className="mt-2 text-sm text-center text-gray-500">
                                {match.venue}
                              </div>
                            )}
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No completed matches yet.</p>
                    )}
                  </div>
                  
                  {matches.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No matches found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leagues Tab Content */}
        {activeTab === 'leagues' && (
          <div className="py-6">
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
                            <div className="text-sm font-medium text-gray-900">{league.name}</div>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {league.type === 'public' ? 'Public' : 'Private'}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            {league.description}
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              {league.members.length} / {league.maxMembers} members
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
          </div>
        )}

        {/* Other tab content would go here */}
      </div>

      {/* Create League Modal */}
      {createLeagueModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-smoke-800 flex">
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
                id="leagueType"
                value={leagueFormData.type}
                onChange={(e) => setLeagueFormData({ ...leagueFormData, type: e.target.value as 'public' | 'private' })}
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
                onClick={async () => {
                  try {
                    setFormError('');
                    // Validate form data
                    if (!leagueFormData.name) {
                      setFormError('League name is required');
                      return;
                    }
                    if (leagueFormData.maxMembers < 2) {
                      setFormError('Max members must be at least 2');
                      return;
                    }
                    
                    // Create league API call
                    const response = await leagueService.createLeague(leagueFormData);
                    if (response.success) {
                      setCreateLeagueModal(false);
                      setLeagueFormData({ name: '', description: '', type: 'private', maxMembers: 20 });
                      // Optionally, refetch leagues or update state to include new league
                    } else {
                      setFormError(response.message || 'Failed to create league');
                    }
                  } catch (error) {
                    setFormError('An error occurred while creating the league');
                    console.error(error);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create League
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join League Modal */}
      {joinLeagueModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-smoke-800 flex">
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
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
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
                      // Optionally, refetch leagues or update state to include new league membership
                    } else {
                      setFormError(response.message || 'Failed to join league');
                    }
                  } catch (error) {
                    setFormError('An error occurred while joining the league');
                    console.error(error);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join League
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
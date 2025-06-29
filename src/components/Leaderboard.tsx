import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Flame, Dumbbell, Calendar, Users, Star, Target, ChevronDown, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BoltBadge from './BoltBadge';
import { 
  getWeeklyLeaderboard, 
  getMonthlyLeaderboard, 
  getAllTimeLeaderboard,
  getUserLeaderboardPosition,
  formatRank,
  getRankColor,
  getScoreDescription,
  LeaderboardEntry,
  UserRank
} from '../services/leaderboardService';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';

const Leaderboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedPeriod]);

  useEffect(() => {
    if (user) {
      loadUserRank();
    }
  }, [user, selectedPeriod]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: LeaderboardEntry[] = [];
      
      switch (selectedPeriod) {
        case 'weekly':
          data = await getWeeklyLeaderboard();
          break;
        case 'monthly':
          data = await getMonthlyLeaderboard();
          break;
        case 'all_time':
          data = await getAllTimeLeaderboard();
          break;
      }
      
      setLeaderboardData(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    if (!user) return;

    try {
      const rank = await getUserLeaderboardPosition(user.id, selectedPeriod);
      setUserRank(rank);
    } catch (err) {
      console.error('Error loading user rank:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLeaderboardData(), loadUserRank()]);
    setRefreshing(false);
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'all_time': return 'All Time';
    }
  };

  const getPeriodIcon = () => {
    switch (selectedPeriod) {
      case 'weekly': return Calendar;
      case 'monthly': return TrendingUp;
      case 'all_time': return Crown;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return Crown;
    if (rank === 2) return Medal;
    if (rank === 3) return Trophy;
    return Target;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to view the leaderboard and see how you compare with other users.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 group hover:shadow-lg transform hover:scale-105"
          >
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-200">
              <ArrowLeft className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:-translate-x-1 transition-transform duration-200" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-gray-100 block">Back to Dashboard</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Return to main app</span>
            </div>
          </button>
        </div>
        
        {/* Header */}
        <div className="text-center mt-12 mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fitness Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            See how you rank against other CoreFit.ai users in nutrition tracking and fitness activities
          </p>
        </div>

        {/* Period Selection & Refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-1">
            {(['weekly', 'monthly', 'all_time'] as LeaderboardPeriod[]).map((period) => {
              const Icon = getPeriodIcon();
              const isSelected = selectedPeriod === period;
              
              return (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">
                    {period === 'weekly' ? 'Weekly' : period === 'monthly' ? 'Monthly' : 'All Time'}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {refreshing ? 'Updating...' : 'Refresh'}
            </span>
          </button>
        </div>

        {/* User's Rank Card */}
        {userRank && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl border border-blue-200 dark:border-blue-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Ranking</h3>
                <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {getPeriodLabel()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getRankColor(userRank.userRank)}`}>
                    {formatRank(userRank.userRank)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of {userRank.totalUsers} users
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(userRank.totalScore)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userRank.mealsLogged}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Meals Logged</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {userRank.workoutsCompleted}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Workouts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {getPeriodLabel()} Champions
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{leaderboardData.length} active users</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {getScoreDescription(selectedPeriod)}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Data Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Be the first to log meals and workouts to appear on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaderboardData.map((entry, index) => {
                const RankIcon = getRankIcon(entry.rank);
                const isTopThree = entry.rank <= 3;
                
                return (
                  <div
                    key={index}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RankIcon className={`h-5 w-5 ${getRankColor(entry.rank)}`} />
                          <span className={`font-bold text-lg ${getRankColor(entry.rank)}`}>
                            {formatRank(entry.rank)}
                          </span>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {entry.userDisplay || 'Anonymous User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Score: {Math.round(entry.totalScore)} • {entry.daysActive} active days
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {entry.mealsLogged}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Meals</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {entry.workoutsCompleted}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Workouts</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-orange-600 dark:text-orange-400">
                            {Math.round(entry.caloriesLogged).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Cal Logged</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            {Math.round(entry.caloriesBurned).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Cal Burned</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Stats */}
                    <div className="sm:hidden mt-3 grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center bg-blue-50 dark:bg-blue-900/30 rounded p-2">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {entry.mealsLogged}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Meals</div>
                      </div>
                      <div className="text-center bg-emerald-50 dark:bg-emerald-900/30 rounded p-2">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {entry.workoutsCompleted}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Workouts</div>
                      </div>
                      <div className="text-center bg-orange-50 dark:bg-orange-900/30 rounded p-2">
                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                          {Math.round(entry.caloriesLogged / 1000)}k
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Cal Log</div>
                      </div>
                      <div className="text-center bg-red-50 dark:bg-red-900/30 rounded p-2">
                        <div className="font-semibold text-red-600 dark:text-red-400">
                          {Math.round(entry.caloriesBurned / 1000)}k
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Cal Burn</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6 border border-purple-100 dark:border-purple-700">
            <Star className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Keep Going!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm max-w-2xl mx-auto">
              The leaderboard updates automatically as you log meals and workouts. 
              Stay consistent to climb the ranks and achieve your fitness goals!
            </p>
          </div>
        </div>
      </div>
    </div>
    <BoltBadge />
    </>
  );
};

export default Leaderboard;
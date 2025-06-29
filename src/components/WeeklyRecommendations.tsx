import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Brain, Loader2, ChevronDown, ChevronUp, BarChart3, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { getWeeklyData } from '../services/dataService';
import { getWeeklyRecommendations } from '../services/geminiApi';
import { getUserProfile } from '../services/profileService';
import { saveUserGoalFromRecommendation } from '../services/goalsService';
import { useAuth } from '../contexts/AuthContext';
import { WeeklyAnalysis, WeeklyRecommendation, UserProfile } from '../types';

const WeeklyRecommendations: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<WeeklyRecommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [implementingGoal, setImplementingGoal] = useState<string | null>(null);
  const { user } = useAuth();

  // Generate week options
  const weekOptions = Array.from({ length: 8 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (7 * i));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return {
      value: i,
      label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} weeks ago`,
      dates: `${formatDate(startDate)} - ${formatDate(endDate)}`
    };
  });

  const fetchData = async (weekOffset: number = 0) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const [data, profile] = await Promise.all([
        getWeeklyData(user.id, weekOffset),
        getUserProfile(user.id)
      ]);
      
      setWeeklyData(data);
      setUserProfile(profile);
      
      if (data) {
        const recs = await getWeeklyRecommendations(data, profile);
        setRecommendations(recs);
        console.log('📊 Got fresh weekly recommendations:', recs.length);
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setError('Failed to load weekly analysis. Please try again or check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user || !weeklyData || refreshing) return;
    
    setRefreshing(true);
    setError(null);
    try {
      console.log('🔄 Manually refreshing AI recommendations...');
      const recs = await getWeeklyRecommendations(weeklyData, userProfile);
      setRecommendations(recs);
      console.log('✅ Successfully refreshed recommendations:', recs.length);
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to get AI recommendations. Please try again in a moment.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleImplementGoal = async (recommendation: WeeklyRecommendation) => {
    if (!user || !recommendation.suggestedGoal) return;
    
    setImplementingGoal(recommendation.id);
    try {
      await saveUserGoalFromRecommendation(user.id, {
        goal_type: recommendation.suggestedGoal.type,
        target_value: recommendation.suggestedGoal.target,
        unit: recommendation.suggestedGoal.unit
      });
      
      // Show success state briefly
      setTimeout(() => {
        setImplementingGoal(null);
      }, 2000);
    } catch (error) {
      console.error('Error implementing goal:', error);
      setImplementingGoal(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData(selectedWeek);
    }
  }, [user, selectedWeek]);

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-300">Analyzing your weekly data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-8">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <Brain className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">Analysis Failed</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => fetchData(selectedWeek)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!weeklyData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Log some meals and workouts to get personalized AI recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 p-5 border-b border-purple-200 dark:border-purple-800/50">
        <div className="text-red-600 dark:text-red-400 mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-sm p-2.5 rounded-xl shadow-sm border border-purple-200/50 dark:border-purple-700/30">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Weekly AI Analysis</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {refreshing ? 'Getting fresh AI insights...' : 'AI-powered insights from Gemini'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {weeklyData && recommendations && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm border border-purple-200/50 dark:border-purple-700/30 group"
              title="Get fresh AI recommendations"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-purple-500 dark:text-purple-300' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="text-sm font-medium whitespace-nowrap">
                {refreshing ? 'Asking Gemini...' : 'Get New Insights'}
              </span>
            </button>
          )}

          <div className="relative">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200/70 dark:border-purple-700/30 rounded-xl text-gray-700 dark:text-gray-200 py-2.5 pl-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium"
            >
              {weekOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.dates})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Calories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {weeklyData.totalCalories.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Workouts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {weeklyData.totalWorkouts}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg Daily</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(weeklyData.avgDailyCalories)}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Calories Burned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {weeklyData.totalCaloriesBurned.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={rec.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                <div 
                  className="flex items-start justify-between cursor-pointer" 
                  onClick={() => toggleCard(index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {rec.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {rec.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {expandedCard === index ? rec.description : `${rec.description.substring(0, 150)}...`}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    {rec.suggestedGoal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImplementGoal(rec);
                        }}
                        disabled={implementingGoal === rec.id}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                      >
                        {implementingGoal === rec.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>Set Goal</span>
                          </>
                        )}
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {expandedCard === index ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedCard === index && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {rec.actionSteps && rec.actionSteps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Action Steps:
                        </h4>
                        <ul className="space-y-2">
                          {rec.actionSteps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.suggestedGoal && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Suggested Goal:
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {rec.suggestedGoal.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {rec.suggestedGoal.target} {rec.suggestedGoal.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <div className="text-right mt-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {refreshing 
                  ? 'Getting fresh recommendations...' 
                  : `Last updated: ${new Date().toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {refreshing ? 'Generating New Recommendations' : 'Generating AI Recommendations'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {refreshing 
                ? 'Gemini is analyzing your data for fresh insights...' 
                : 'Please wait while Gemini analyzes your data...'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-w-md mx-auto">
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto">
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyRecommendations;
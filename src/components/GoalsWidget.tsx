import React, { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Edit3, Trash2, Check, X, Trophy, Flame, Dumbbell, Clock, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  getUserGoals, 
  saveUserGoal, 
  deleteUserGoal, 
  getDefaultGoals, 
  calculateTodaysProgress, 
  refreshAllGoalProgress,
  isGoalTypeDueForReset,
  isUserGoalDueForReset
} from '../services/goalsService';
import { UserGoal, GoalProgress } from '../types';

export const fetchAndRefreshGoals = async (userId: string, setGoals: React.Dispatch<React.SetStateAction<UserGoal[]>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>) => {
  try {
    if (setLoading) setLoading(true);
    const userGoals = await getUserGoals(userId);
    setGoals(userGoals);
  } catch (error) {
    console.error('Error loading goals:', error);
  } finally {
    if (setLoading) setLoading(false);
  }
};

interface GoalsWidgetProps {
  className?: string;
}

const GoalsWidget: React.FC<GoalsWidgetProps> = ({ className = '' }) => {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    goalType: 'daily_calories' as const,
    targetValue: 2000,
    unit: 'calories' as const,
  });
  const [progressUpdateStatus, setProgressUpdateStatus] = useState({
    lastUpdated: new Date(),
    unit: 'calories' as const,
  });

  const { user } = useAuth();

  const goalTypeOptions = [
    { value: 'daily_calories', label: 'Daily Calories', unit: 'calories', icon: Flame, color: 'text-red-600 dark:text-red-400' },
    { value: 'daily_protein', label: 'Daily Protein', unit: 'grams', icon: Target, color: 'text-blue-600 dark:text-blue-400' },
    { value: 'daily_carbs', label: 'Daily Carbs', unit: 'grams', icon: TrendingUp, color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'daily_fats', label: 'Daily Fats', unit: 'grams', icon: Target, color: 'text-purple-600 dark:text-purple-400' },
    { value: 'weekly_workouts', label: 'Weekly Workouts', unit: 'workouts', icon: Dumbbell, color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  useEffect(() => {
    if (user) {
      fetchAndRefreshGoals(user.id, setGoals, setLoading);
      loadProgress(true);
      
      // Initial reset check on mount
      checkAndRefreshGoals();
    }
  }, [user]); 

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (!user || isRefreshing) return;
    
    setIsRefreshing(true);
    setRefreshError(null);
    
    try {
      // Force goal refresh using the server function
      await forceResetAllGoals(user.id);
      // Reload goals from database
      await fetchAndRefreshGoals(user.id, setGoals);
      // Reload progress
      await loadProgress(true);
      setLastRefreshed(new Date());
    } catch (error: any) {
      setRefreshError(error.message || 'Failed to refresh goals');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add interval to check for goal resets periodically
  useEffect(() => {
    // Check for goal resets every minute
    const intervalId = setInterval(() => { 
      if (user && goals.length > 0) {
        checkAndRefreshGoals();
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [user, goals]);

  // Function to check if any goals need to be reset, and refresh if needed
  const checkAndRefreshGoals = useCallback(() => {
    console.log('⏱️ Checking if goals need refresh...');
    if (!user || goals.length === 0) return;
    
    // Check if any goals need to be reset
    const needsReset = goals.some(goal => 
      isGoalTypeDueForReset(goal.goalType, new Date(goal.lastResetAt || 0))
    );
    
    const timeSinceLastRefresh = new Date().getTime() - lastRefreshed.getTime();
    const needsRegularRefresh = timeSinceLastRefresh > 60000; // More than 1 minute
    
    if (needsReset) {
      console.log('🔄 Goals need to be refreshed - detected day/week boundary crossing');
      refreshAllGoalProgress(user.id)
        .then(() => fetchAndRefreshGoals(user.id, setGoals))
        .then(() => loadProgress(true));
    } else if (needsRegularRefresh) {
      // Periodic refresh even if no boundary crossed
      console.log('⏱️ Performing regular goal progress refresh');
      loadProgress(false);
    }
  }, [user, goals, lastRefreshed]);

  const loadProgress = async (forceRefresh: boolean = false) => {
    if (!user) return;
    
    try {
      // If it's been over 1 minute since last refresh or force refresh is requested
      if (forceRefresh || (new Date().getTime() - lastRefreshed.getTime() > 60000)) {
        await refreshAllGoalProgress(user.id);
      }
      
      const todaysProgress = await calculateTodaysProgress(user.id); 
      setProgress(todaysProgress);
      setLastRefreshed(new Date());
      setProgressUpdateStatus({
        lastUpdated: new Date(),
        unit: 'calories',
      });
      
      // Debug log current progress values
      console.log('📊 Current progress values:', {
        todaysProgress,
        time: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('❌ Error loading progress:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!user || isRefreshing) return;

    console.log('🎯 Adding new goal:', newGoal);
    try {
      await saveUserGoal({
        goalType: newGoal.goalType,
        targetValue: newGoal.targetValue,
        currentValue: progress[newGoal.goalType] || 0,
        unit: newGoal.unit,
        isActive: true,
      }, user.id);

      await fetchAndRefreshGoals(user.id, setGoals);
      setShowAddGoal(false);
      setNewGoal({
        goalType: 'daily_calories',
        targetValue: 2000,
        unit: 'calories',
      });
      
      // Refresh progress after adding a new goal
      await loadProgress(true);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteUserGoal(goalId);
      await fetchAndRefreshGoals(user.id, setGoals);
      
      // Refresh progress after deleting a goal
      await loadProgress(true);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getGoalProgress = useCallback((goal: UserGoal): GoalProgress => {
    // Use the actual current_value from the database (which is refreshed on load)
    // rather than calculating from progress, since the database handles resets
    const currentValue = goal.currentValue || 0;
    const percentage = Math.min(100, (currentValue / goal.targetValue) * 100);
    const goalTypeOption = goalTypeOptions.find(opt => opt.value === goal.goalType);
    
    return {
      goalType: goal.goalType,
      title: goalTypeOption?.label || goal.goalType,
      targetValue: goal.targetValue,
      currentValue,
      unit: goal.unit,
      percentage,
      color: goalTypeOption?.color || 'text-gray-600',
      icon: goalTypeOption?.icon.name || 'Target',
    };
  }, [goalTypeOptions]);

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-3 sm:mb-4">
            <div className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-5 lg:p-6 ${className} mobile-card-gradient`}>
      <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
        <div className="flex items-center space-x-3 sm:space-x-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">My Goals</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Track your fitness progress</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`p-1.5 lg:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 touch-manipulation ${isRefreshing ? 'animate-pulse' : ''}`}
            title="Refresh goals"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="p-1.5 lg:p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md sm:rounded-lg lg:rounded-xl transition-all duration-200 touch-manipulation"
            title="Add goal"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-3 sm:space-y-3.5 mobile-spacing">
        {goals.map((goal) => {
          // Check if goal needs resetting (for debugging)
          const needsReset = isUserGoalDueForReset(goal);
          
          const goalProgress = getGoalProgress(goal);
          const Icon = goalTypeOptions.find(opt => opt.value === goal.goalType)?.icon || Target;
          
          return (
            <div key={goal.id} className="bg-gray-50 dark:bg-gray-700/80 rounded-xl sm:rounded-xl lg:rounded-xl p-3.5 sm:p-4 lg:p-5 shadow-md animate-fade-in-up">
              <div className="flex items-center justify-between mb-3 sm:mb-3.5">
                <div className="flex items-center space-x-3 sm:space-x-3">
                  <div className={`p-2 sm:p-2.5 rounded-xl shadow-sm ${goalProgress.color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-').replace('-600', '-100').replace('-400', '-900')} bg-opacity-70 dark:bg-opacity-50`}>
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${goalProgress.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base sm:text-lg">{goalProgress.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {goalProgress.currentValue.toFixed(0)} / {goalProgress.targetValue.toFixed(0)} {goalProgress.unit}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {goalProgress.percentage >= 100 && (
                    <div className="bg-emerald-100 dark:bg-emerald-900 p-1.5 rounded-full shadow-md">
                      <Trophy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <span className={`text-base sm:text-lg font-semibold ${goalProgress.color}`}>
                    {goalProgress.percentage.toFixed(0)}%
                  </span>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 touch-manipulation"
                    title="Delete goal"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 sm:h-3 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getProgressColor(goalProgress.percentage)}`}
                  style={{ width: `${Math.min(100, goalProgress.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Status/Error */}
      {refreshError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{refreshError}</p>
          </div>
        </div>
      )}

      {/* Last Updated Timestamp - For debugging */}
      {goals.length > 0 && !showAddGoal && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
            {isRefreshing && (
              <RefreshCw className="h-3 w-3 text-gray-400 dark:text-gray-500 animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      {showAddGoal && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg sm:rounded-xl">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 text-sm sm:text-base">Add New Goal</h3>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Goal Type
              </label>
              <select
                value={newGoal.goalType}
                onChange={(e) => {
                  const selectedType = e.target.value as any;
                  const selectedOption = goalTypeOptions.find(opt => opt.value === selectedType);
                  setNewGoal({
                    ...newGoal,
                    goalType: selectedType,
                    unit: selectedOption?.unit as any || 'calories',
                  });
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {goalTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Target ({newGoal.unit})
              </label>
              <input
                type="number"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                min="1"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={handleAddGoal}
                className="flex-1 bg-emerald-500 text-white py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation text-sm sm:text-base"
              >
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Add Goal</span>
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="px-4 py-2 sm:py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 touch-manipulation"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 && !showAddGoal && (
        <div className="text-center py-6 sm:py-8">
          <Target className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-2">No goals set yet</p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mb-4">Add your first goal to start tracking progress</p>
          <button
            onClick={() => setShowAddGoal(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
          >
            Add First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalsWidget;
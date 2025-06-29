import React, { useState, useEffect } from 'react';
import { BarChart3, Target, TrendingUp, Lightbulb, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { NutritionData, FitnessActivity, DashboardData } from '../types';
import { getWeeklyData } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  nutritionData?: NutritionData[];
  fitnessData?: FitnessActivity[];
  onSwitchToWeekly?: () => void;
}

type TimePeriod = 'today' | 'weekly' | 'monthly';

interface PeriodData {
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  netCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  workouts: number;
  avgDailyCalories: number;
  avgDailyProtein: number;
}

const Dashboard: React.FC<DashboardProps> = ({ nutritionData = [], fitnessData = [], onSwitchToWeekly }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && selectedPeriod !== 'today') {
      loadPeriodData();
    }
  }, [selectedPeriod, user]);

  const loadPeriodData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (selectedPeriod === 'weekly') {
        const data = await getWeeklyData(user.id, 0);
        setWeeklyData(data);
      } else if (selectedPeriod === 'monthly') {
        // Get data for the last 4 weeks to approximate a month
        const weeksData = await Promise.all([
          getWeeklyData(user.id, 0),
          getWeeklyData(user.id, 1),
          getWeeklyData(user.id, 2),
          getWeeklyData(user.id, 3)
        ]);
        
        // Combine all weeks data
        const monthlyAggregated = {
          totalCalories: weeksData.reduce((sum, week) => sum + week.totalCalories, 0),
          totalProtein: weeksData.reduce((sum, week) => sum + week.totalProtein, 0),
          totalCarbs: weeksData.reduce((sum, week) => sum + week.totalCarbs, 0),
          totalFats: weeksData.reduce((sum, week) => sum + week.totalFats, 0),
          totalWorkouts: weeksData.reduce((sum, week) => sum + week.totalWorkouts, 0),
          totalCaloriesBurned: weeksData.reduce((sum, week) => sum + week.totalCaloriesBurned, 0),
          avgDailyCalories: Math.round(weeksData.reduce((sum, week) => sum + week.totalCalories, 0) / 28),
          avgDailyCaloriesBurn: Math.round(weeksData.reduce((sum, week) => sum + week.totalCaloriesBurned, 0) / 28)
        };
        setMonthlyData(monthlyAggregated);
      }
    } catch (error) {
      console.error('Error loading period data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayData = (): PeriodData => {
    const totalCaloriesConsumed = nutritionData.reduce((sum, item) => sum + item.calories, 0);
    const totalCaloriesBurned = fitnessData.reduce((sum, item) => sum + item.caloriesBurned, 0);
    const netCalories = totalCaloriesConsumed - totalCaloriesBurned;

    const macros = nutritionData.reduce(
      (totals, item) => ({
        protein: totals.protein + item.protein,
        carbs: totals.carbs + item.carbs,
        fats: totals.fats + item.fats,
      }),
      { protein: 0, carbs: 0, fats: 0 }
    );

    return {
      totalCaloriesConsumed,
      totalCaloriesBurned,
      netCalories,
      macros,
      workouts: fitnessData.length,
      avgDailyCalories: totalCaloriesConsumed,
      avgDailyProtein: macros.protein,
    };
  };

  const calculateWeeklyData = (): PeriodData => {
    if (!weeklyData) return calculateTodayData();
    
    return {
      totalCaloriesConsumed: weeklyData.totalCalories,
      totalCaloriesBurned: weeklyData.totalCaloriesBurned,
      netCalories: weeklyData.totalCalories - weeklyData.totalCaloriesBurned,
      macros: {
        protein: weeklyData.totalProtein,
        carbs: weeklyData.totalCarbs,
        fats: weeklyData.totalFats,
      },
      workouts: weeklyData.totalWorkouts,
      avgDailyCalories: weeklyData.avgDailyCalories,
      avgDailyProtein: Math.round(weeklyData.totalProtein / 7),
    };
  };

  const calculateMonthlyData = (): PeriodData => {
    if (!monthlyData) return calculateTodayData();
    
    return {
      totalCaloriesConsumed: monthlyData.totalCalories,
      totalCaloriesBurned: monthlyData.totalCaloriesBurned,
      netCalories: monthlyData.totalCalories - monthlyData.totalCaloriesBurned,
      macros: {
        protein: monthlyData.totalProtein,
        carbs: monthlyData.totalCarbs,
        fats: monthlyData.totalFats,
      },
      workouts: monthlyData.totalWorkouts,
      avgDailyCalories: monthlyData.avgDailyCalories,
      avgDailyProtein: Math.round(monthlyData.totalProtein / 28),
    };
  };

  const getCurrentData = (): PeriodData => {
    switch (selectedPeriod) {
      case 'weekly':
        return calculateWeeklyData();
      case 'monthly':
        return calculateMonthlyData();
      default:
        return calculateTodayData();
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return "Today's";
    }
  };

  const getPeriodDescription = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return 'Your progress this week';
      case 'monthly':
        return 'Your progress this month';
      default:
        return 'Your progress today';
    }
  };

  const dashboardData = getCurrentData();

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Stats Overview - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl lg:rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4 sm:p-5 lg:p-6 mobile-card-gradient">
        <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">{getPeriodLabel()} Overview</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">{getPeriodDescription()}</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="relative">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
              className="appearance-none bg-white dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-9 text-sm sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 shadow-sm mobile-tap-target"
            >
              <option value="today">Today</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {loading && selectedPeriod !== 'today' ? (
          <div className="text-center py-6 sm:py-7 lg:py-8">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-base text-gray-600 dark:text-gray-300">Loading {selectedPeriod} data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-5 lg:mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 p-3 sm:p-4 lg:p-4 rounded-xl sm:rounded-xl lg:rounded-xl shadow-md">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{dashboardData.totalCaloriesConsumed}</div>
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  {selectedPeriod === 'today' ? 'Calories Consumed' : 'Total Calories'}
                </div>
                {selectedPeriod !== 'today' && (
                  <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Avg: {dashboardData.avgDailyCalories}/day
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50 p-3 sm:p-4 lg:p-4 rounded-xl sm:rounded-xl lg:rounded-xl shadow-md">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{dashboardData.totalCaloriesBurned}</div>
                <div className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                  {selectedPeriod === 'today' ? 'Calories Burned' : 'Total Burned'}
                </div>
                {selectedPeriod !== 'today' && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                    {dashboardData.workouts} workouts
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/50 p-3 sm:p-4 lg:p-4 rounded-xl sm:rounded-xl lg:rounded-xl shadow-md">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 dark:text-orange-400">{dashboardData.netCalories}</div>
                <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">Net Calories</div>
                {selectedPeriod !== 'today' && (
                  <div className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    {dashboardData.netCalories > 0 ? 'Surplus' : 'Deficit'}
                  </div>
                )}
              </div>
            </div>

            {/* Macronutrients - Mobile Optimized */}
            {dashboardData.macros.protein > 0 && ( 
              <div className="bg-gray-50 dark:bg-gray-700/80 rounded-xl sm:rounded-xl lg:rounded-xl p-3.5 sm:p-4 lg:p-5 shadow-md mobile-card-gradient">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-3 text-sm sm:text-base">
                  Macronutrients {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'weekly' ? 'This Week' : 'This Month'}
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                  <div className="text-center bg-white/40 dark:bg-gray-600/40 p-2.5 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-base sm:text-lg lg:text-xl font-semibold text-red-600 dark:text-red-400">{dashboardData.macros.protein}g</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">Protein</div>
                    {selectedPeriod !== 'today' && (
                      <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                        Avg: {dashboardData.avgDailyProtein}g/day
                      </div>
                    )}
                  </div>
                  <div className="text-center bg-white/40 dark:bg-gray-600/40 p-2.5 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-base sm:text-lg lg:text-xl font-semibold text-yellow-600 dark:text-yellow-400">{dashboardData.macros.carbs}g</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">Carbs</div>
                    {selectedPeriod !== 'today' && (
                      <div className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
                        Avg: {Math.round(dashboardData.macros.carbs / (selectedPeriod === 'weekly' ? 7 : 28))}g/day
                      </div>
                    )}
                  </div>
                  <div className="text-center bg-white/40 dark:bg-gray-600/40 p-2.5 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-base sm:text-lg lg:text-xl font-semibold text-purple-600 dark:text-purple-400">{dashboardData.macros.fats}g</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">Fats</div>
                    {selectedPeriod !== 'today' && (
                      <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                        Avg: {Math.round(dashboardData.macros.fats / (selectedPeriod === 'weekly' ? 7 : 28))}g/day
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Weekly Analysis Prompt - Mobile Optimized */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-purple-100 dark:border-purple-700 p-3 sm:p-4 lg:p-5">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">AI Weekly Analysis</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Get comprehensive insights from your past week</p>
          </div>
        </div>

        <div className="text-center py-3 sm:py-4 lg:py-5">
          <div className="bg-white dark:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6 border border-purple-200 dark:border-purple-600">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl w-fit mx-auto mb-2 sm:mb-3 lg:mb-4">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">Ready for Deep Insights?</h3>            
            <p className="text-gray-600 dark:text-gray-200 text-xs sm:text-sm mb-3 leading-tight">
              Get comprehensive AI recommendations based on your entire week's nutrition and fitness data.
            </p>
            <button
              onClick={onSwitchToWeekly}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 sm:py-2.5 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2 mb-3 text-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>View Weekly Analysis</span>
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              ✨ Powered by Google AI • Analyzes patterns, trends & progress
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Mobile Optimized */}
      {(nutritionData.length > 0 || fitnessData.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Your latest nutrition and fitness entries</p>
            </div>
          </div>
          <div className="space-y-2">
            {[...nutritionData, ...fitnessData]
              .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
              .slice(0, 5)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {'meal' in item ? (
                      <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded">
                        <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="bg-emerald-100 dark:bg-emerald-900 p-1 rounded">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {'meal' in item ? item.meal : `${item.activity} - ${item.duration}min`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        {item.recordedAt.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200">
                    {'calories' in item ? `${item.calories} cal` : `${item.caloriesBurned} cal burned`}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
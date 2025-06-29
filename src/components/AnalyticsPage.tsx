import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart2, PieChart, TrendingUp, Calendar, ChevronLeft, Loader2, AlertCircle, ArrowUpRight, Activity, Dumbbell, RefreshCw, Clock } from 'lucide-react';
import { getWeeklyData } from '../services/dataService';
import { WeeklyAnalysis } from '../types';
import BoltBadge from './BoltBadge';

const AnalyticsPage: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Function to aggregate data from multiple weeks
  const aggregateMonthlyData = async (userId: string): Promise<WeeklyAnalysis> => {
    try {
      // Fetch data for the past 4 weeks and combine them
      const [week0, week1, week2, week3] = await Promise.all([
        getWeeklyData(userId, 0), // Current week
        getWeeklyData(userId, 1), // 1 week ago
        getWeeklyData(userId, 2), // 2 weeks ago
        getWeeklyData(userId, 3), // 3 weeks ago
      ]);
      
      // Combine the daily breakdowns (maintaining original dates)
      const combinedDailyBreakdown = [
        ...week3.dailyBreakdown,
        ...week2.dailyBreakdown,
        ...week1.dailyBreakdown,
        ...week0.dailyBreakdown,
      ];
      
      // Filter to keep only the most recent 30 days
      const last30Days = combinedDailyBreakdown
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
        .slice(0, 30); // Take the most recent 30 days
      
      // Recalculate the totals
      const totalCalories = last30Days.reduce((sum, day) => sum + day.calories, 0);
      const totalProtein = last30Days.reduce((sum, day) => sum + day.protein, 0);
      const totalCarbs = last30Days.reduce((sum, day) => sum + day.carbs, 0);
      const totalFats = last30Days.reduce((sum, day) => sum + day.fats, 0);
      const totalWorkouts = last30Days.reduce((sum, day) => sum + day.workouts, 0);
      const totalWorkoutMinutes = last30Days.reduce((sum, day) => sum + day.workoutMinutes, 0);
      const totalCaloriesBurned = last30Days.reduce((sum, day) => sum + day.caloriesBurned, 0);
      
      // Sort by date again (oldest to newest) for display
      const sortedDays = last30Days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        totalCalories,
        avgDailyCalories: Math.round(totalCalories / 30),
        totalProtein,
        totalCarbs,
        totalFats,
        totalWorkouts,
        totalWorkoutMinutes,
        totalCaloriesBurned,
        avgDailyCaloriesBurn: Math.round(totalCaloriesBurned / 30),
        dailyBreakdown: sortedDays
      };
    } catch (error) {
      console.error('Error aggregating monthly data:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      loadWeeklyData();
    } else {
      setLoading(false);
    }
  }, [user, timeframe]);

  const loadWeeklyData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      if (timeframe === 'week') {
        // Just get current week's data
        const data = await getWeeklyData(user.id, 0);
        setWeeklyData(data);
      } else {
        // Get aggregated data for the past 30 days
        const monthlyData = await aggregateMonthlyData(user.id);
        setWeeklyData(monthlyData);
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers for charts and visualizations
  const getChartData = () => {
    if (!weeklyData) return null;
    
    // Create data for a calories breakdown pie chart
    const caloriesByCategoryData = [
      { name: 'Protein', value: weeklyData.totalProtein * 4, color: 'bg-red-500 dark:bg-red-600' },
      { name: 'Carbs', value: weeklyData.totalCarbs * 4, color: 'bg-blue-500 dark:bg-blue-600' },
      { name: 'Fats', value: weeklyData.totalFats * 9, color: 'bg-amber-500 dark:bg-amber-600' },
    ];

    // Calculate percentages
    const totalMacroCalories = caloriesByCategoryData.reduce((sum, item) => sum + item.value, 0);
    caloriesByCategoryData.forEach(item => {
      item['percentage'] = totalMacroCalories > 0 ? Math.round((item.value / totalMacroCalories) * 100) : 0;
    });
    
    return {
      caloriesByCategoryData
    };
  };

  const chartData = getChartData();

  // Basic bar chart component
  const BarChart = ({ data, title }: { data: Array<{date: string, value: number}>, title: string }) => {
    const maxValue = Math.max(...data.map(item => item.value), 1); // Ensure we don't divide by zero
    const avgValue = data.reduce((sum, item) => sum + item.value, 0) / (data.length || 1);
    
    return (
      <div className="h-full w-full">
        {title && <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-4">{title}</h3>}
        <div className="flex flex-col space-y-3 mt-2">
          {data.map((item, index) => {
            // Ensure minimum bar width for better visibility
            const percentage = Math.max((item.value / maxValue) * 100, 2);
            // Use different gradient based on value compared to average
            let gradientClass = 
              item.value > avgValue * 1.2 ? "from-emerald-500 to-green-500" : 
              item.value < avgValue * 0.8 ? "from-orange-500 to-red-400" : 
              "from-blue-500 to-emerald-500";
            
            // Special case for zero values
            if (item.value === 0) {
              gradientClass = "from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500";
            }
            
            return (
              <div key={index} className="flex items-center space-x-3 group">
                <div className="w-20 text-xs text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{item.date}</div>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700/60 rounded-md overflow-hidden relative shadow-sm">
                  <div 
                    className={`h-full bg-gradient-to-r ${gradientClass} rounded-md transition-all duration-500 ease-out shadow-inner group-hover:opacity-95`}
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  >
                    {percentage > 15 && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <span className="text-xs font-semibold text-white drop-shadow-sm">{item.value}</span>
                      </div>
                    )}
                  </div>
                  {percentage <= 15 && (
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{item.value > 0 ? item.value : 'No data'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const formatDate = (dateString: string) => {
    if (timeframe === 'week') {
      return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };
  
  // Enhanced pie chart component
  const MacroPieChart = ({ data }: { data: Array<{name: string, value: number, percentage: number, color: string}> }) => {
    return (
      <div className="relative">
        {/* SVG Pie Chart */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {data.map((item, index) => {
                const total = data.reduce((sum, i) => sum + i.percentage, 0);
                const startAngle = data
                  .slice(0, index)
                  .reduce((sum, i) => sum + (i.percentage / total) * 360, 0);
                const endAngle = startAngle + (item.percentage / total) * 360;
                
                // Convert angles to radians
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                // Calculate coordinates
                const x1 = 50 + 40 * Math.cos(startRad);
                const y1 = 50 + 40 * Math.sin(startRad);
                const x2 = 50 + 40 * Math.cos(endRad);
                const y2 = 50 + 40 * Math.sin(endRad);
                
                // Flag for large arc
                const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
                
                return (
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    className={item.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
            
            {/* Center info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-28 w-28 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden relative">
                {/* Colored background based on macronutrient proportions */}
                <div className="absolute inset-0">
                  <div 
                    className="w-full h-full" 
                    style={{
                      background: `conic-gradient(
                        #ef4444 0% ${data[0].percentage}%, 
                        #3b82f6 ${data[0].percentage}% ${data[0].percentage + data[1].percentage}%, 
                        #f59e0b ${data[0].percentage + data[1].percentage}% 100%
                      )`
                    }}
                  ></div>
                </div>
                {/* Semi-transparent overlay for better text readability */}
                <div className="absolute inset-0 bg-black/70 dark:bg-black/80"></div>
                
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 bg-clip-text text-transparent animate-pulse-slow">
                  {data.reduce((sum, item) => sum + item.value, 0)}
                </span>
                <span className="text-sm text-white font-medium tracking-wide mt-1">calories</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend and Bar Chart */}
        <div className="flex flex-col space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 w-24 group">
                <div className={`w-4 h-4 rounded-sm ${item.color} group-hover:scale-110 transition-transform shadow-sm`}></div>
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex-1 mx-2 group">
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-110`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center space-x-1 min-w-16 text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.percentage}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({item.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add animation class for slower pulse
  useEffect(() => {
    // Add custom animation class if it doesn't exist
    if (!document.querySelector('style#custom-animations')) {
      const style = document.createElement('style');
      style.id = 'custom-animations';
      style.textContent = `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up when component unmounts
      const styleEl = document.querySelector('style#custom-animations');
      if (styleEl) styleEl.remove();
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <BarChart2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your analytics</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Back to Dashboard</span>
          </button>
          
          {/* Refresh Button */}
          {!loading && weeklyData && (
            <button
              onClick={loadWeeklyData}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-sm">Refresh Data</span>
            </button>
          )}
        </div>
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500/90 to-emerald-500/90 rounded-xl shadow-md p-6 mb-6 text-white">
          <div className="flex items-center space-x-4 mb-5">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl shadow-md">
              <BarChart2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics & Insights</h1>
              <p className="text-blue-50/80 text-sm mt-0.5">
                {timeframe === 'week' 
                  ? "Track your progress this week"
                  : "View trends from the last 30 days"}
              </p>
            </div>
          </div>
          
          {/* Timeframe Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex bg-white/20 backdrop-blur-sm p-1 rounded-lg">
              <button
                onClick={() => setTimeframe('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  timeframe === 'week' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  timeframe === 'month' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center max-w-md">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Loading analytics data...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Preparing insights from your {timeframe === 'week' ? 'weekly' : 'monthly'} activity</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center max-w-md mx-auto">
            <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full w-fit mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadWeeklyData}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-colors shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : !weeklyData ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full w-fit mx-auto mb-4">
              <BarChart2 className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Available</h3>
            <div className="space-y-1 mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {timeframe === 'week' 
                  ? "Start tracking your meals and workouts this week to see analytics."
                  : "No data found for the last 30 days. Try tracking some meals and workouts."}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Go back to the dashboard to log your activities
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-colors shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Meals Logged */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transform transition-transform hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-gray-700 dark:text-gray-200 font-medium">Meals Logged</h2>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {weeklyData.totalCalories > 0 ? weeklyData.dailyBreakdown.filter(day => day.calories > 0).length : 0}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">days</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {timeframe === 'week' ? '7-day tracking period' : '30-day tracking period'}
                </p>
              </div>
              
              {/* Workouts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transform transition-transform hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-xl">
                      <Dumbbell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-gray-700 dark:text-gray-200 font-medium">Workouts</h2>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {weeklyData.totalWorkouts}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">sessions</div>
                </div>
                <p className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{weeklyData.totalWorkoutMinutes} total minutes</span>
                </p>
              </div>
              
              {/* Daily Calories */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transform transition-transform hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 dark:bg-purple-900/50 p-2.5 rounded-xl">
                      <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-gray-700 dark:text-gray-200 font-medium">Daily Calories</h2>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {weeklyData.avgDailyCalories}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">avg</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {weeklyData.totalCalories.toLocaleString()} total calories consumed
                </p>
              </div>
              
              {/* Daily Protein */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transform transition-transform hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 dark:bg-red-900/50 p-2.5 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-gray-700 dark:text-gray-200 font-medium">Daily Protein</h2>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(weeklyData.totalProtein / (timeframe === 'week' ? 7 : 30))}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">g</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {weeklyData.totalProtein}g total protein consumed
                </p>
              </div>
            </div>
            
            {/* Macro Breakdown */}
            {chartData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 transform transition-transform hover:scale-[1.01] duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Calorie Sources</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/70 px-2 py-1 rounded-full">
                      {weeklyData.totalCalories === 0 ? 'No data available' : 'Macronutrient Breakdown'}
                    </div>
                  </div>
                  
                  {weeklyData.totalCalories === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[260px] text-center">
                      <PieChart className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-1">No nutrition data available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Log meals to see your macro breakdown</p>
                    </div>
                  ) : (
                    <MacroPieChart data={chartData.caloriesByCategoryData} />
                  )}
                </div>
                
                {/* Daily Calorie Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 transform transition-transform hover:scale-[1.01] duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Daily Calorie Trend</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/70 px-2 py-1 rounded-full">
                    {timeframe === 'week' ? '7 days' : '30 days'}{weeklyData.totalCalories === 0 ? ' - No data yet' : ''} 
                    </div>
                  </div>
                  
                  <div className="h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <BarChart 
                      data={weeklyData.dailyBreakdown.map(day => ({
                        date: formatDate(day.date),
                        value: day.calories
                      }))}
                      title=""
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Daily Breakdown Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 transform transition-transform hover:scale-[1.01] duration-300">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Daily Breakdown</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/70 px-2 py-1 rounded-full">
                  Detailed Stats
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/80">
                    <tr>
                      <th className="px-4 py-3.5 rounded-tl-lg">{timeframe === 'week' ? 'Day' : 'Date'}</th>
                      <th className="px-4 py-3.5">Calories</th>
                      <th className="px-4 py-3.5">Protein</th>
                      <th className="px-4 py-3.5">Carbs</th>
                      <th className="px-4 py-3.5">Fats</th>
                      <th className="px-4 py-3.5 rounded-tr-lg text-center">Workouts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.dailyBreakdown.map((day, index) => {
                      const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                      const rowClasses = [
                        'border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                        isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      ].join(' ').trim();
                      
                      return (
                      <tr key={index} className={rowClasses}>
                        <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(day.date)}
                          {isToday && <span className="ml-2 text-xs text-blue-500 dark:text-blue-400 font-normal">(Today)</span>}
                        </td>
                        <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400 font-medium">{day.calories}</td>
                        <td className="px-4 py-3.5 text-red-600 dark:text-red-400">{day.protein}g</td>
                        <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400">{day.carbs}g</td>
                        <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400">{day.fats}g</td>
                        <td className="px-4 py-3.5 text-center">
                          {day.workouts > 0 ? (
                            <span className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium min-w-8">
                              {day.workouts} {day.workouts === 1 ? 'workout' : 'workouts'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <BoltBadge />
    </div>
  );
}

export default AnalyticsPage;
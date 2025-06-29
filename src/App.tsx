import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './components/Auth';
import { refreshAllGoalProgress } from './services/goalsService';
import PasswordReset from './components/PasswordReset';
import HomePage from './components/HomePage';
import Header from './components/Header';
import FoodTracking from './components/FoodTracking';
import FitnessTracking from './components/FitnessTracking';
import Dashboard from './components/Dashboard';
import WeeklyRecommendations from './components/WeeklyRecommendations';
import AnalyticsPage from './components/AnalyticsPage';
import ProfilePage from './components/ProfilePage';
import BoltBadge from './components/BoltBadge';
import RatingModal from './components/RatingModal';
import GoalsWidget from './components/GoalsWidget';
import PrivacyPolicy from './components/PrivacyPolicy';
import Leaderboard from './components/Leaderboard';
import { getNutritionData, getFitnessData } from './services/dataService';
import { canUserRate, saveUserRating } from './services/statsService';
import { NutritionData, FitnessActivity } from './types';

function AppContent() {
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [fitnessData, setFitnessData] = useState<FitnessActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');
  const [showAuth, setShowAuth] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        // Ensure goals are properly reset if needed when app loads
        try {
          await refreshAllGoalProgress(user.id);
        } catch (refreshError) {
          console.warn('Unable to refresh goal progress on startup', refreshError);
        }
        
        try {
          const [nutrition, fitness] = await Promise.all([
            getNutritionData(user.id),
            getFitnessData(user.id)
          ]);
          setNutritionData(nutrition);
          setFitnessData(fitness);

          // Check if user can rate the app (after recording first meal and workout)
          const canRate = await canUserRate(user.id);
          const hasCompletedBothActivities = nutrition.length > 0 && fitness.length > 0;
          
          if (canRate && hasCompletedBothActivities) {
            // Show rating modal after a short delay when user has tried both features
            setTimeout(() => {
              setShowRatingModal(true);
            }, 2000);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        // Clear data when user logs out
        setNutritionData([]);
        setFitnessData([]);
      }
      setLoading(false);
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading]);

  const handleMealLogged = (nutrition: NutritionData) => {
    setNutritionData(prev => [nutrition, ...prev]);
    
    // Check if we should show rating modal after this meal log
    checkAndShowRatingModal(nutrition, null);
  };

  const handleActivityLogged = (activity: FitnessActivity) => {
    setFitnessData(prev => [activity, ...prev]);
    
    // Check if we should show rating modal after this activity log
    checkAndShowRatingModal(null, activity);
  };

  const checkAndShowRatingModal = async (newNutrition?: NutritionData | null, newActivity?: FitnessActivity | null) => {
    if (!user || showRatingModal) return;
    
    // Get current counts including the new item
    const currentNutritionCount = nutritionData.length + (newNutrition ? 1 : 0);
    const currentFitnessCount = fitnessData.length + (newActivity ? 1 : 0);
    
    // Check if user has now completed both types of tracking
    const hasCompletedBoth = currentNutritionCount > 0 && currentFitnessCount > 0;
    
    if (hasCompletedBoth) {
      try {
        // Check if user hasn't already rated
        const canRate = await canUserRate(user.id);
        if (canRate) {
          // Show rating modal after completing both activities
          setTimeout(() => {
            setShowRatingModal(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking if user can rate:', error);
      }
    }
  };

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleSubmitRating = async (rating: number, feedback?: string) => {
    if (!user) return;
    
    try {
      await saveUserRating(user.id, rating);
      setShowRatingModal(false);
      
      // Show thank you message
      // You could add a toast notification here
      console.log('Rating submitted successfully:', rating, feedback);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  // Filter today's data for the dashboard
  const getTodaysData = () => {
    const today = new Date().toDateString();
    
    const todaysNutrition = nutritionData.filter(item => 
      item.recordedAt.toDateString() === today
    );
    
    const todaysFitness = fitnessData.filter(item => 
      item.recordedAt.toDateString() === today
    );
    
    return { todaysNutrition, todaysFitness };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center safe-area-inset transition-colors duration-200">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4 shadow-lg">
            <div className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Loading...</p>
        </div>
        <BoltBadge />
      </div>
    );
  }

  // Show home page if user is not logged in and hasn't clicked get started
  if (!user && !showAuth) {
    return (
      <>
        <HomePage onGetStarted={handleGetStarted} />
        <BoltBadge />
      </>
    );
  }

  // Show auth if user clicked get started or is in auth flow
  if (!user) {
    return (
      <>
        <Auth />
        <BoltBadge />
      </>
    );
  }

  const { todaysNutrition, todaysFitness } = getTodaysData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset transition-colors duration-200 mobile-container">
      <Header />
      
      <main className="max-w-7xl mx-auto mobile-padding py-4 sm:py-6 lg:py-8">
        {/* Welcome Section - Mobile Optimized */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 lg:mb-4 px-2">
            Welcome back to <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">CoreFit.ai</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-200 max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto px-4">
            Snap. Track. Transform. Your personalized path to better health.
          </p>
        </div>

        {/* Tab Navigation - Mobile Optimized */}
        <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8 px-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1 w-full max-w-xs sm:max-w-sm lg:max-w-none lg:w-auto">
            <button
              onClick={() => setActiveTab('today')}
              className={`w-1/2 lg:w-auto lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-md sm:rounded-lg lg:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm lg:text-base ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Today's Tracking
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`w-1/2 lg:w-auto lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-md sm:rounded-lg lg:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm lg:text-base ${
                activeTab === 'weekly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Weekly Analysis
            </button>
          </div>
        </div>

        {activeTab === 'today' ? (
          <>
            {/* Main Content Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 lg:col-span-1">
                <FoodTracking onMealLogged={handleMealLogged} />
                <FitnessTracking onActivityLogged={handleActivityLogged} />
              </div>
              
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 lg:col-span-1">
                <GoalsWidget />
                <Dashboard 
                  nutritionData={todaysNutrition} 
                  fitnessData={todaysFitness} 
                  onSwitchToWeekly={() => setActiveTab('weekly')}
                />
              </div>
            </div>

            {/* Features Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-3 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">AI Nutrition Analysis</h3>
                <p className="text-gray-600 dark:text-gray-200 text-xs leading-tight">Describe your meals or take photos for instant nutritional breakdowns powered by AI</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="bg-emerald-100 dark:bg-emerald-900 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-3 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Smart Fitness Tracking</h3>
                <p className="text-gray-600 dark:text-gray-200 text-xs leading-tight">Log activities and get personalized motivation with calorie burn estimates</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105 sm:col-span-2 lg:col-span-1">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-3 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Weekly AI Analysis</h3>
                <p className="text-gray-600 dark:text-gray-200 text-xs leading-tight">Get comprehensive weekly insights and personalized recommendations from Google AI</p>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto px-2">
            <WeeklyRecommendations />
          </div>
        )}
      </main>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmitRating={handleSubmitRating}
      />

      {/* Bolt.new Badge */}
      <BoltBadge />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Password Reset Route - Always accessible, no auth required */}
          <Route path="/auth/reset-password" element={
            <>
              <PasswordReset />
              <BoltBadge />
            </>
          } />
          
          {/* Privacy Policy Route - Always accessible, no auth required */}
          <Route path="/privacy" element={
            <>
              <PrivacyPolicy />
              <BoltBadge />
            </>
          } />
          
          {/* Leaderboard Route - Requires authentication */}
          <Route path="/leaderboard" element={
            <Leaderboard />
          } />
          
          {/* Analytics Route - Requires authentication */}
          <Route path="/analytics" element={
            <AnalyticsPage />
          } />
          
          {/* Profile Route - Requires authentication */}
          <Route path="/profile" element={
            <ProfilePage />
          } />
          
          {/* All other routes */}
          <Route path="*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
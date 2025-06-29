import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import NutritionTracker from './components/NutritionTracker';
import FitnessTracker from './components/FitnessTracker';
import WeeklyAnalysis from './components/WeeklyAnalysis';
import Profile from './components/Profile';
import RatingModal from './components/RatingModal';
import GoalsWidget from './components/GoalsWidget';
import PrivacyPolicy from './components/PrivacyPolicy';
import Leaderboard from './components/Leaderboard';
import { supabase } from './lib/supabase';
import { getNutritionData, getFitnessData } from './services/dataService';
import { canUserRate, saveUserRating } from './services/statsService'; 
import { NutritionData, FitnessActivity } from './types';

// Check if any database migrations are needed
const checkDatabaseSetup = async () => {
  try {
    // Check if our last_reset_at column exists on user_goals table
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('column_exists', {
        table_name: 'user_goals',
        column_name: 'last_reset_at'
      });
      
    if (columnError) {
      console.warn('⚠️ Could not check database schema:', columnError);
    } else if (!columnInfo) {
      console.warn('⚠️ last_reset_at column missing from user_goals table');
    } else {
      console.log('✅ Database schema check passed');
    }
  } catch (error) {
    console.warn('⚠️ Error checking database setup:', error);
  }
};

function AppContent() {
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [fitnessData, setFitnessData] = useState<FitnessActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check database setup when app loads
    checkDatabaseSetup();
    
    const loadUserData = async () => {
      if (user) {
        try {
          const [nutrition, fitness] = await Promise.all([
            getNutritionData(user.id),
            getFitnessData(user.id)
          ]);
          setNutritionData(nutrition);
          setFitnessData(fitness);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    const checkRatingEligibility = async () => {
      if (user) {
        const canRate = await canUserRate(user.id);
        if (canRate) {
          setShowRatingModal(true);
        }
      }
    };

    checkRatingEligibility();
  }, [user]);

  const handleSubmitRating = async (rating: number, feedback?: string) => {
    if (user) {
      await saveUserRating(user.id, rating, feedback);
      setShowRatingModal(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
              Welcome back to <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">CoreFit.ai</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-200 max-w-xl sm:max-w-2xl mx-auto px-2">
              Track your nutrition and fitness with the power of AI. Get personalized recommendations 
              and insights to help you achieve your health goals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center mb-6 sm:mb-8 gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('today')}
              className={`w-1/2 sm:w-auto sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Today's Tracking
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`w-1/2 sm:w-auto sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === 'weekly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Weekly Analysis
            </button>
          </div>

          {activeTab === 'today' ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <NutritionTracker 
                    data={nutritionData} 
                    onDataUpdate={setNutritionData}
                  />
                  <FitnessTracker 
                    data={fitnessData} 
                    onDataUpdate={setFitnessData}
                  />
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <GoalsWidget />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Nutrition Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-200 text-xs sm:text-sm">Describe your meals or take photos for instant nutritional breakdowns powered by AI</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Smart Fitness Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-200 text-xs sm:text-sm">Log activities and get personalized motivation with calorie burn estimates</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105 md:col-span-3 lg:col-span-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly AI Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-200 text-xs sm:text-sm">Get comprehensive weekly insights and personalized recommendations from Google AI</p>
                </div>
              </div>
            </>
          ) : (
            <WeeklyAnalysis 
              nutritionData={nutritionData} 
              fitnessData={fitnessData}
            />
          )}
        </div>
      </main>
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmitRating={handleSubmitRating}
      />
    </div>
  );
}

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#374151' : '#ffffff',
              color: theme === 'dark' ? '#f3f4f6' : '#111827',
              border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
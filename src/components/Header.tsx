import React from 'react';
import { Activity, Brain, LogOut, User, Sun, Moon, Trophy, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isOnLeaderboard = location.pathname === '/leaderboard';
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 safe-area-inset-top transition-colors duration-200 mobile-container">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 relative">
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-1.5 sm:p-2 lg:p-2.5 rounded-xl sm:rounded-xl lg:rounded-2xl shadow-md">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div className="flex-shrink-0" onClick={() => navigate('/')}>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">CoreFit.ai</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Snap. Track. Transform.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-3 lg:space-x-4">
            {/* Navigation Menu */}
            <Navigation className="mr-2" />
            
            <div className="hidden sm:flex items-center space-x-1 lg:space-x-2 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/40 dark:to-emerald-900/40 px-2.5 lg:px-3 py-1.5 lg:py-1.5 rounded-full shadow-sm">
              <Brain className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-200">AI Powered</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl sm:rounded-xl lg:rounded-xl transition-all duration-200 touch-manipulation mobile-tap-target"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 lg:h-4 lg:w-4" />
              ) : (
                <Sun className="h-4 w-4 lg:h-4 lg:w-4" />
              )}
            </button>
          
            {user && (
              <div className="flex items-center ml-auto">
                <div className="flex items-center bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/50 dark:to-emerald-900/50 rounded-lg shadow-md overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1.5">
                    <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 max-w-20 sm:max-w-32 md:max-w-none truncate">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 h-full px-2 sm:px-3 text-gray-700 dark:text-gray-200 transition-colors duration-200 flex items-center justify-center"
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5 text-gray-800 dark:text-gray-200" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
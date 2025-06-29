import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Shield, Save, Loader2, Bell, Key, Lock, ChevronLeft, LogOut } from 'lucide-react';
import UserProfileSetup from './UserProfileSetup';
import { getUserProfile } from '../services/profileService';
import { UserProfile } from '../types';
import BoltBadge from './BoltBadge';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.id);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProfile();
  }, [user]);

  const handleProfileSave = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Please sign in to view your profile.</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4 shadow-lg">
            <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Back to Dashboard</span>
        </button>
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-4 rounded-full shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.email?.split('@')[0]}</h1>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          {activeTab === 'profile' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                  Your Profile
                </h2>
                
                <UserProfileSetup 
                  initialProfile={profile} 
                  onProfileSave={handleProfileSave}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                  Account Settings
                </h2>
                
                <div className="space-y-4">
                  {/* Password Section */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                          <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Password</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Change your password</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/auth/reset-password')}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  
                  {/* Privacy Section */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Privacy Policy</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Read our privacy policy</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/privacy')}
                        className="px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                          <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Logout</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <BoltBadge />
    </div>
  );
};

export default ProfilePage;
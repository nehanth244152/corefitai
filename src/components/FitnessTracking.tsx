import React, { useState, useEffect } from 'react';
import { Dumbbell, Clock, Flame, Loader2, CheckCircle, User, Brain, Calendar, Sun as Run, Footprints, Bike, Waves, Heart, Weight, Music, Mountain, Tally1 as Ball, Brackets as Racquet, Activity, HelpCircle } from 'lucide-react';
import { getFitnessMotivation, getAICalorieBurn } from '../services/geminiApi';
import { saveFitnessData } from '../services/dataService';
import { getUserProfile, saveUserProfile } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FitnessActivity, UserProfile } from '../types';
import UserProfileSetup from './UserProfileSetup';

interface FitnessTrackingProps {
  onActivityLogged: (activity: FitnessActivity) => void;
}

const FitnessTracking: React.FC<FitnessTrackingProps> = ({ onActivityLogged }) => {
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [aiCalorieEstimate, setAiCalorieEstimate] = useState<{ calories: number; explanation: string } | null>(null);
  const [estimatingCalories, setEstimatingCalories] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customActivityError, setCustomActivityError] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().slice(0, 16);
  });

  const { user } = useAuth();
  const { theme } = useTheme();

  const activityTypes = [
    { name: 'Running', icon: Run, color: 'from-red-500 to-orange-500' },
    { name: 'Walking', icon: Footprints, color: 'from-green-500 to-emerald-500' },
    { name: 'Cycling', icon: Bike, color: 'from-blue-500 to-cyan-500' },
    { name: 'Swimming', icon: Waves, color: 'from-blue-600 to-teal-500' },
    { name: 'Yoga', icon: Heart, color: 'from-purple-500 to-pink-500' },
    { name: 'Weight Training', icon: Weight, color: 'from-gray-600 to-gray-800' },
    { name: 'Dancing', icon: Music, color: 'from-pink-500 to-rose-500' },
    { name: 'Hiking', icon: Mountain, color: 'from-green-600 to-lime-500' },
    { name: 'Basketball', icon: Ball, color: 'from-orange-500 to-amber-500' },
    { name: 'Tennis', icon: Racquet, color: 'from-yellow-500 to-orange-400' },
    { name: 'Pilates', icon: Activity, color: 'from-indigo-500 to-purple-500' },
    { name: 'Other', icon: HelpCircle, color: 'from-gray-500 to-slate-500' }
  ];

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
          if (!profile) {
            setShowProfileSetup(true);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
      setProfileLoading(false);
    };

    loadUserProfile();
  }, [user]);

  // Get AI calorie estimate when activity or duration changes
  useEffect(() => {
    const getCalorieEstimate = async () => {
      const currentActivity = activity === 'Other' ? customActivity : activity;
      if (currentActivity && duration && userProfile && parseInt(duration) > 0) {
        setEstimatingCalories(true);
        try {
          const estimate = await getAICalorieBurn(currentActivity, parseInt(duration), userProfile);
          setAiCalorieEstimate(estimate);
          setCustomActivityError('');
        } catch (error) {
          console.error('Error getting AI calorie estimate:', error);
          // Fallback to basic calculation
          setAiCalorieEstimate({
            calories: estimateCaloriesBurned(currentActivity, parseInt(duration)),
            explanation: 'Basic estimate based on activity type and duration.'
          });
          setCustomActivityError('');
        } finally {
          setEstimatingCalories(false);
        }
      } else {
        setAiCalorieEstimate(null);
      }
    };

    const timeoutId = setTimeout(getCalorieEstimate, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [activity, customActivity, duration, userProfile]);

  const estimateCaloriesBurned = (activityType: string, durationMin: number): number => {
    const caloriesPerMinute: { [key: string]: number } = {
      'Running': 12,
      'Walking': 4,
      'Cycling': 8,
      'Swimming': 10,
      'Yoga': 3,
      'Weight Training': 6,
      'Dancing': 5,
      'Hiking': 7,
      'Basketball': 9,
      'Tennis': 8,
      'Pilates': 4,
      'Other': 5
    };
    
    return Math.round((caloriesPerMinute[activityType] || 5) * durationMin);
  };

  const handleProfileSave = async (profile: UserProfile) => {
    if (user) {
      try {
        await saveUserProfile(profile, user.id);
        setUserProfile(profile);
        setShowProfileSetup(false);
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }
  };

  const handleLogActivity = async () => {
    const currentActivity = activity === 'Other' ? customActivity : activity;
    if (!currentActivity || !duration) return;

    // Validate custom activity if Other is selected
    if (activity === 'Other' && customActivity.trim()) {
      // Basic validation to check if it's likely a fitness activity
      const fitnessKeywords = ['run', 'walk', 'jog', 'swim', 'bike', 'cycle', 'lift', 'weight', 'push', 'pull', 'squat', 'lunge', 'yoga', 'pilates', 'dance', 'aerobic', 'cardio', 'strength', 'train', 'exercise', 'workout', 'gym', 'fit', 'sport', 'tennis', 'basketball', 'soccer', 'football', 'baseball', 'volleyball', 'badminton', 'climb', 'hike', 'surf', 'ski', 'skate', 'box', 'martial', 'karate', 'judo', 'taekwondo', 'crossfit', 'zumba', 'spin', 'rowing', 'jumping', 'burpee', 'plank', 'stretch'];
      const isValidActivity = fitnessKeywords.some(keyword => 
        customActivity.toLowerCase().includes(keyword)
      );
      
      if (!isValidActivity) {
        setCustomActivityError('Please enter a valid exercise or workout activity.');
        return;
      }
    }

    setIsLogging(true);
    const durationNum = parseInt(duration);
    const caloriesBurned = aiCalorieEstimate?.calories || estimateCaloriesBurned(activity, durationNum);

    try {
      const motivationMessage = await getFitnessMotivation(currentActivity, durationNum);
      setMotivation(motivationMessage);

      const activityData: FitnessActivity = {
        activity: currentActivity,
        duration: durationNum,
        caloriesBurned,
        timestamp: new Date(), // When logged
        recordedAt: new Date(recordedAt), // When actually performed
      };

      // Save to database if user is logged in
      if (user) {
        await saveFitnessData(activityData, user.id);
      }

      onActivityLogged(activityData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActivity('');
        setCustomActivity('');
        setShowCustomInput(false);
        setCustomActivityError('');
        setDuration('');
        setAiCalorieEstimate(null);
        // Reset to current time
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localTime = new Date(now.getTime() - (offset * 60 * 1000));
        setRecordedAt(localTime.toISOString().slice(0, 16));
      }, 3000);
    } catch (error) {
      console.error('Error logging activity:', error);
    } finally {
      setIsLogging(false);
    }
  };

  // Function to format motivation text for better readability
  const formatMotivationText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle bold text (markdown style)
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split('**');
        return (
          <p key={index} className="mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="font-semibold text-gray-900 dark:text-gray-100">{part}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </p>
        );
      }
      
      // Handle bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        return (
          <li key={index} className="ml-4 mb-1 text-gray-700 dark:text-gray-300">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }
      
      // Regular paragraphs
      if (trimmedLine.length > 0) {
        return (
          <p key={index} className="mb-2 text-gray-700 dark:text-gray-200 leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
      
      return null;
    });
  };

  const getActivityIcon = (activityName: string) => {
    const activityType = activityTypes.find(type => type.name === activityName);
    return activityType || activityTypes.find(type => type.name === 'Other')!;
  };

  if (profileLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-3 sm:mb-4">
            <div className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">AI-powered calorie estimates</p>
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <UserProfileSetup
        onProfileSave={handleProfileSave}
        initialProfile={userProfile}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
        <div className="flex items-center space-x-3 sm:space-x-3">
          <div className="bg-emerald-100 dark:bg-emerald-900 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl">
            <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Fitness Tracking</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">AI calorie estimates</p>
          </div>
        </div>
        
        {userProfile && (
          <button
            onClick={() => setShowProfileSetup(true)} 
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl transition-all duration-200 touch-manipulation"
          >
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Update Info</span>
          </button>
        )}
      </div>

      <div className="space-y-4 sm:space-y-5 field-group">
        {/* When was this workout performed */}
        <div>
          <label htmlFor="workout-recorded-at" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            When did you do this workout?
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="datetime-local"
              id="workout-recorded-at"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="mobile-input w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-3 sm:py-3.5 lg:py-4 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base bg-white dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 mobile-tap-target"
            />
          </div>
        </div>

        {/* Activity Type with Icons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">
            Activity Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3 lg:gap-4">
            {activityTypes.map((activityType) => {
              const Icon = activityType.icon;
              const isSelected = activity === activityType.name;
              
              return (
                <button
                  key={activityType.name}
                  onClick={() => {
                    setActivity(activityType.name);
                    setShowCustomInput(activityType.name === 'Other');
                    if (activityType.name !== 'Other') {
                      setCustomActivity('');
                      setCustomActivityError('');
                    }
                  }}
                  className={`relative p-3 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-xl lg:rounded-2xl border-2 transition-all duration-300 touch-manipulation mobile-tap-target transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 dark:border-emerald-400 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/90 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-25 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  <div className={`bg-gradient-to-r ${activityType.color} p-2 sm:p-2.5 rounded-xl sm:rounded-xl w-fit mx-auto mb-2 sm:mb-2.5 shadow-sm`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className={`text-xs font-medium text-center leading-tight ${
                    isSelected 
                      ? 'text-emerald-700 dark:text-emerald-200' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}>
                    {activityType.name}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 sm:-top-1.5 sm:-right-1.5">
                      <div className="bg-emerald-500 dark:bg-emerald-400 rounded-full p-1 sm:p-1 shadow-md">
                        <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 text-white dark:text-gray-900" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Activity Input for Other */}
        {showCustomInput && activity === 'Other' && (
          <div>
            <label htmlFor="custom-activity" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              What workout or exercise are you doing?
            </label>
            <input
              type="text"
              id="custom-activity"
              value={customActivity}
              onChange={(e) => {
                setCustomActivity(e.target.value);
                if (customActivityError) setCustomActivityError('');
              }}
              placeholder="e.g., Running, Weightlifting, Yoga, Swimming..."
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-200 dark:border-gray-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {customActivityError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{customActivityError}</p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Please enter a valid exercise or workout activity for accurate calorie calculation.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            min="1"
            max="300"
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-200 dark:border-gray-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <button
          onClick={handleLogActivity}
          disabled={!activity || !duration || isLogging || !userProfile || (activity === 'Other' && !customActivity.trim()) || customActivityError} 
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 lg:py-4 px-5 rounded-xl sm:rounded-xl lg:rounded-2xl font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:translate-y-[-1px] hover:scale-[1.02] active:translate-y-[1px] active:shadow-md disabled:transform-none text-base lg:text-lg min-h-[52px]"
        >
          {isLogging ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Logging activity...</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5" />
              <span>Log Activity</span>
            </>
          )}
        </button>

        {!userProfile && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Profile Required</span>
            </div>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200">
              Set up your profile to get personalized AI calorie estimates based on your age, weight, and activity level.
            </p>
          </div>
        )}

        {showSuccess && (
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 p-4 rounded-xl sm:rounded-xl animate-fade-in-up shadow-sm">
            <CheckCircle className="h-5 w-5" />
            <span className="text-base font-medium">Activity logged successfully!</span>
          </div>
        )}

        {aiCalorieEstimate && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/40 dark:to-blue-900/40 rounded-xl sm:rounded-xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-700 shadow-md animate-fade-in-up">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">AI Calorie Estimate</span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 mb-2">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {aiCalorieEstimate.calories}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">calories burned</div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">{aiCalorieEstimate.explanation}</p>
          </div>
        )}

        {estimatingCalories && ( 
          <div className="bg-gray-50 dark:bg-gray-700/80 rounded-xl sm:rounded-xl p-4 sm:p-5 shadow-md animate-fade-in-up">
            <div className="flex items-center space-x-2 mb-2">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Getting AI estimate...</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Calculating personalized calorie burn based on your profile</p>
          </div>
        )}

        {motivation && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/40 dark:to-blue-900/40 rounded-xl sm:rounded-xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-700 shadow-md animate-fade-in-up">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center space-x-2 text-sm sm:text-base">
              <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              <span>AI Motivation</span>
            </h3>
            <div className="prose prose-sm max-w-none text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {formatMotivationText(motivation)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessTracking;
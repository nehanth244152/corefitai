import React, { useState } from 'react';
import { User, Save, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfile } from '../types';

interface UserProfileSetupProps {
  onProfileSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
  isLoading?: boolean;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ 
  onProfileSave, 
  initialProfile,
  isLoading = false 
}) => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({
    age: initialProfile?.age || 25,
    weight: initialProfile?.weight || 70,
    height: initialProfile?.height || 170,
    gender: initialProfile?.gender || 'other',
    activityLevel: initialProfile?.activityLevel || 'moderately_active',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onProfileSave(profile);
    } finally {
      setSaving(false);
    }
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
    { value: 'extremely_active', label: 'Extremely Active (very hard exercise, physical job)' },
  ];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4">
            <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-xl">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Profile</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">Help us provide accurate calorie estimates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Age (years)
            </label>
            <input
              type="number"
              id="age"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
              min="13"
              max="120"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Gender
            </label>
            <select
              id="gender"
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' | 'other' })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              id="weight"
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || 0 })}
              min="30"
              max="300"
              step="0.1"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              id="height"
              value={profile.height}
              onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
              min="100"
              max="250"
              step="0.1"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="activity-level" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Activity Level
          </label>
          <select
            id="activity-level"
            value={profile.activityLevel}
            onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as UserProfile['activityLevel'] })}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {activityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UserProfileSetup;
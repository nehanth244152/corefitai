import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    // No profile found
    return null;
  }

  return {
    age: data.age,
    weight: parseFloat(data.weight),
    height: parseFloat(data.height),
    gender: data.gender,
    activityLevel: data.activity_level,
  };
};

export const saveUserProfile = async (profile: UserProfile, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .upsert([
      {
        user_id: userId,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        activity_level: profile.activityLevel,
      },
    ], { onConflict: 'user_id' });

  if (error) throw error;
};
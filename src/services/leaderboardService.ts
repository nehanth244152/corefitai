import { supabase } from '../lib/supabase';

export interface LeaderboardEntry {
  rank: number;
  userDisplay: string;
  mealsLogged: number;
  workoutsCompleted: number;
  caloriesLogged: number;
  caloriesBurned: number;
  daysActive: number;
  totalScore: number;
}

export interface UserRank {
  userRank: number;
  totalUsers: number;
  mealsLogged: number;
  workoutsCompleted: number;
  caloriesLogged: number;
  caloriesBurned: number;
  daysActive: number;
  totalScore: number;
}

export const getWeeklyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  console.log('📊 Fetching weekly leaderboard...');
  
  try {
    const { data, error } = await supabase.rpc('get_weekly_leaderboard');
    
    if (error) {
      console.error('❌ Error fetching weekly leaderboard:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No weekly leaderboard data found');
      return [];
    }
    
    const leaderboardData = data.map((entry: any) => ({
      rank: entry.rank || 0,
      userDisplay: entry.user_display || 'Anonymous',
      mealsLogged: entry.meals_logged || 0,
      workoutsCompleted: entry.workouts_completed || 0,
      caloriesLogged: parseFloat(entry.calories_logged) || 0,
      caloriesBurned: parseFloat(entry.calories_burned) || 0,
      daysActive: entry.days_active || 0,
      totalScore: parseFloat(entry.total_score) || 0
    }));
    
    console.log('✅ Weekly leaderboard fetched:', leaderboardData.length, 'entries');
    return leaderboardData;
    
  } catch (error) {
    console.error('💥 Error in getWeeklyLeaderboard:', error);
    return [];
  }
};

export const getMonthlyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  console.log('📊 Fetching monthly leaderboard...');
  
  try {
    const { data, error } = await supabase.rpc('get_monthly_leaderboard');
    
    if (error) {
      console.error('❌ Error fetching monthly leaderboard:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No monthly leaderboard data found');
      return [];
    }
    
    const leaderboardData = data.map((entry: any) => ({
      rank: entry.rank || 0,
      userDisplay: entry.user_display || 'Anonymous',
      mealsLogged: entry.meals_logged || 0,
      workoutsCompleted: entry.workouts_completed || 0,
      caloriesLogged: parseFloat(entry.calories_logged) || 0,
      caloriesBurned: parseFloat(entry.calories_burned) || 0,
      daysActive: entry.days_active || 0,
      totalScore: parseFloat(entry.total_score) || 0
    }));
    
    console.log('✅ Monthly leaderboard fetched:', leaderboardData.length, 'entries');
    return leaderboardData;
    
  } catch (error) {
    console.error('💥 Error in getMonthlyLeaderboard:', error);
    return [];
  }
};

export const getAllTimeLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  console.log('📊 Fetching all-time leaderboard...');
  
  try {
    const { data, error } = await supabase.rpc('get_all_time_leaderboard');
    
    if (error) {
      console.error('❌ Error fetching all-time leaderboard:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No all-time leaderboard data found');
      return [];
    }
    
    const leaderboardData = data.map((entry: any) => ({
      rank: entry.rank || 0,
      userDisplay: entry.user_display || 'Anonymous',
      mealsLogged: entry.meals_logged || 0,
      workoutsCompleted: entry.workouts_completed || 0,
      caloriesLogged: parseFloat(entry.calories_logged) || 0,
      caloriesBurned: parseFloat(entry.calories_burned) || 0,
      daysActive: entry.days_active || 0,
      totalScore: parseFloat(entry.total_score) || 0
    }));
    
    console.log('✅ All-time leaderboard fetched:', leaderboardData.length, 'entries');
    return leaderboardData;
    
  } catch (error) {
    console.error('💥 Error in getAllTimeLeaderboard:', error);
    return [];
  }
};

export const getUserLeaderboardPosition = async (
  userId: string, 
  period: 'weekly' | 'monthly' | 'all_time' = 'weekly'
): Promise<UserRank | null> => {
  console.log('📊 Fetching user leaderboard position:', { userId, period });
  
  try {
    const { data, error } = await supabase.rpc('get_user_leaderboard_position', {
      target_user_id: userId,
      period: period
    });
    
    if (error) {
      console.error('❌ Error fetching user leaderboard position:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No user leaderboard position found');
      return null;
    }
    
    const userRank = data[0];
    const result: UserRank = {
      userRank: userRank.user_rank || 0,
      totalUsers: userRank.total_users || 0,
      mealsLogged: userRank.meals_logged || 0,
      workoutsCompleted: userRank.workouts_completed || 0,
      caloriesLogged: parseFloat(userRank.calories_logged) || 0,
      caloriesBurned: parseFloat(userRank.calories_burned) || 0,
      daysActive: userRank.days_active || 0,
      totalScore: parseFloat(userRank.total_score) || 0
    };
    
    console.log('✅ User leaderboard position found:', result);
    return result;
    
  } catch (error) {
    console.error('💥 Error in getUserLeaderboardPosition:', error);
    return null;
  }
};

export const formatRank = (rank: number): string => {
  if (rank === 1) return '🥇 1st';
  if (rank === 2) return '🥈 2nd';
  if (rank === 3) return '🥉 3rd';
  return `#${rank}`;
};

export const getRankColor = (rank: number): string => {
  if (rank === 1) return 'text-yellow-600 dark:text-yellow-400';
  if (rank === 2) return 'text-gray-600 dark:text-gray-400';
  if (rank === 3) return 'text-orange-600 dark:text-orange-400';
  if (rank <= 10) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-500 dark:text-gray-300';
};

export const getScoreDescription = (period: 'weekly' | 'monthly' | 'all_time'): string => {
  const baseDescription = 'Score calculated from meals logged, workouts completed, active days, and total activity';
  
  switch (period) {
    case 'weekly':
      return `${baseDescription}. Updated weekly.`;
    case 'monthly':
      return `${baseDescription}. Updated monthly.`;
    case 'all_time':
      return `${baseDescription}. All-time total.`;
    default:
      return baseDescription;
  }
};
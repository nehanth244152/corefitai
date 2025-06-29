import { supabase } from '../lib/supabase';
import { UserGoal } from '../types';

// Force reset all goals for testing/debugging (client-side implementation)
export const forceResetAllGoals = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Forcing immediate reset and refresh of all goals for user:', userId);
    const { data, error } = await supabase.rpc('force_goals_refresh_now', { target_user_id: userId });
    
    if (error) {
      console.error('❌ Error forcing immediate goal refresh:', error);
      throw error;
    }
    
    console.log('✅ All goals have been force refreshed, current calories:', data);
  } catch (err) {
    console.error('💥 Force refresh failed:', err);
    throw err;
  }
};

export const saveUserGoalFromRecommendation = async (userId: string, goal: {
  goal_type: string;
  target_value: number;
  unit: string;
}) => {
  return saveUserGoal({
    goalType: goal.goal_type as any,
    targetValue: goal.target_value,
    currentValue: 0,
    unit: goal.unit as any,
    isActive: true,
  }, userId);
};

export const getUserGoals = async (userId: string): Promise<UserGoal[]> => {
  console.log('🎯 Fetching user goals for user:', userId);

  // Always refresh all goal progress to handle daily/weekly resets
  await refreshAllGoalProgress(userId);
  
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching user goals:', error);
    throw error;
  }
  
  console.log('✅ User goals fetched:', data?.length || 0, 'goals');

  return data.map((item: any) => ({
    id: item.id,
    goalType: item.goal_type,
    targetValue: parseFloat(item.target_value),
    currentValue: parseFloat(item.current_value),
    unit: item.unit,
    isActive: item.is_active,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    lastResetAt: item.last_reset_at ? new Date(item.last_reset_at) : new Date(),
  }));
};

// Function to refresh all goal progress and handle resets
export const refreshAllGoalProgress = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Refreshing goal progress and checking for resets for user:', userId);
    
    // Call the improved database function that handles auto-resets
    const { error } = await supabase.rpc('refresh_all_goal_progress', { 
      target_user_id: userId 
    });

    if (error) {
      console.error('❌ Error refreshing goal progress and auto-resets:', error);
      throw error;
    }
    
    // Double-check today's calories to ensure goal values are accurate
    try {
      const { data: todaysCalories, error: caloriesError } = await supabase.rpc('get_todays_calories', {
        target_user_id: userId
      });
      
      if (caloriesError) {
        console.error('⚠️ Error getting today\'s calories:', caloriesError);
      } else {
        console.log('✅ Goal progress refreshed successfully. Today\'s calories:', todaysCalories);
      }
    } catch (caloriesErr) {
      console.warn('⚠️ Error double-checking calories:', caloriesErr);
    }
  } catch (err) {
    console.error('💥 Goal refresh failed:', err);
    console.warn('⚠️ Continuing with potentially stale goal data, will retry later');
  }
};

export const saveUserGoal = async (goal: Omit<UserGoal, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> => {
  console.log('💾 Saving user goal:', { userId, goalType: goal.goalType, targetValue: goal.targetValue });
  
  // First, deactivate any existing goal of the same type
  const { error: updateError } = await supabase
    .from('user_goals')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('goal_type', goal.goalType)
    .eq('is_active', true);

  if (updateError) {
    console.error('❌ Error deactivating existing goal:', updateError);
    throw updateError;
  }

  // Then create the new goal
  const { error } = await supabase
    .from('user_goals')
    .insert([
      {
        user_id: userId,
        goal_type: goal.goalType,
        target_value: goal.targetValue,
        current_value: goal.currentValue,
        unit: goal.unit,
        is_active: goal.isActive,
      },
    ]);

  if (error) {
    console.error('❌ Error saving user goal:', error);
    throw error;
  }
  
  console.log('✅ User goal saved successfully');
};

// Client-side check if a goal type is due for reset based on its last reset time
export const isGoalTypeDueForReset = (goalType: string, lastResetAt: Date): boolean => {
  if (!lastResetAt) return true; 
  
  const now = new Date();
  const currentDateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  currentWeekStart.setHours(0, 0, 0, 0);
  
  if (['daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats'].includes(goalType)) {
    return lastResetAt < currentDateStart;
  } else if (goalType === 'weekly_workouts') {
    return lastResetAt < currentWeekStart;
  }
  
  return false;
};

export const updateGoalProgress = async (goalId: string, currentValue: number): Promise<void> => {
  console.log('📈 Updating goal progress:', { goalId, currentValue });
  
  const { error } = await supabase
    .from('user_goals')
    .update({ current_value: currentValue })
    .eq('id', goalId);

  if (error) {
    console.error('❌ Error updating goal progress:', error);
    throw error;
  }
  
  console.log('✅ Goal progress updated successfully');
};

export const deleteUserGoal = async (goalId: string): Promise<void> => {
  console.log('🗑️ Deleting user goal:', goalId);
  
  const { error } = await supabase
    .from('user_goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    console.error('❌ Error deleting user goal:', error);
    throw error;
  }
  
  console.log('✅ User goal deleted successfully');
};

export const getDefaultGoals = (): Omit<UserGoal, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return [
    {
      goalType: 'daily_calories', 
      targetValue: 2000, 
      currentValue: 0,
      unit: 'calories',
      isActive: true,
      lastResetAt: new Date(),
    },
    {
      goalType: 'daily_protein',
      targetValue: 120,
      currentValue: 0,
      unit: 'grams',
      isActive: true,
      lastResetAt: new Date(),
    },
    {
      goalType: 'weekly_workouts',
      targetValue: 4,
      currentValue: 0,
      unit: 'workouts',
      isActive: true, 
      lastResetAt: new Date(),
    },
  ];
};

export const calculateTodaysProgress = async (userId: string): Promise<{ [key: string]: number }> => {
  // Refresh goal progress before calculating
  console.log('🧮 Calculating today\'s progress for goals...');
  try {
    const { error } = await supabase.rpc('refresh_all_goal_progress', { target_user_id: userId });
    if (error) {
      console.error('❌ Error refreshing goal progress before calculation:', error);
    } else {
      console.log('✅ Goal progress refreshed successfully');
    }
  } catch (error) {
    console.error('❌ Error in pre-calculation refresh:', error);
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's nutrition data
  const { data: nutritionData } = await supabase
    .from('nutrition_logs')
    .select('calories, protein, carbs, fats')
    .eq('user_id', userId)
    .gte('recorded_at', `${today}T00:00:00`)
    .lt('recorded_at', `${today}T23:59:59`);

  // Get this week's fitness data
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0); // Set to start of day
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999); // Set to end of day

  const { data: fitnessData } = await supabase
    .from('fitness_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('recorded_at', startOfWeek.toISOString())
    .lte('recorded_at', endOfWeek.toISOString());

  const progress: { [key: string]: number } = {};
  
  if (nutritionData) {
    progress.daily_calories = nutritionData.reduce((sum, item) => sum + (item.calories || 0), 0);
    progress.daily_protein = nutritionData.reduce((sum, item) => sum + (item.protein || 0), 0);
    progress.daily_carbs = nutritionData.reduce((sum, item) => sum + (item.carbs || 0), 0);
    progress.daily_fats = nutritionData.reduce((sum, item) => sum + (item.fats || 0), 0);
  }
  
  if (fitnessData) {
    progress.weekly_workouts = fitnessData.length;
  }

  console.log('🔄 Getting direct progress values from database...');
  
  // Get current values directly from user_goals table
  try {
    const { data: userGoals, error: goalsError } = await supabase
      .from('user_goals')
      .select('goal_type, current_value, last_reset_at')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (!goalsError && userGoals && userGoals.length > 0) {
      console.log('📊 Current goal values from database:', userGoals);
      
      // Add direct values from goals table to progress
      userGoals.forEach(goal => {
        progress[goal.goal_type] = parseFloat(goal.current_value || 0);
      });
    }
  } catch (goalsErr) {
    console.warn('⚠️ Could not get direct goal values:', goalsErr);
  }
  
  return progress;
};

// Client-side check if a specific user goal object needs to be reset
export const isUserGoalDueForReset = (goal: UserGoal): boolean => { 
  if (!goal.lastResetAt) return true;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentWeekStart = new Date(now); 
  currentWeekStart.setDate(now.getDate() - now.getDay()); // Sunday as week start
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const lastReset = new Date(goal.lastResetAt);
  
  // Daily goals
  if (['daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats'].includes(goal.goalType)) {
    return lastReset < today;
  } 
  
  // Weekly goals
  if (goal.goalType === 'weekly_workouts') {
    return lastReset < currentWeekStart; 
  }

  // Default: no reset needed
  
  return false;
};

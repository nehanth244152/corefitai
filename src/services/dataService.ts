import { supabase } from '../lib/supabase';
import { NutritionData, FitnessActivity, WeeklyAnalysis } from '../types';

export const saveNutritionData = async (data: NutritionData, userId: string) => {
  console.log('💾 Saving nutrition data:', { userId, meal: data.meal, calories: data.calories });
  
  const { error } = await supabase
    .from('nutrition_logs')
    .insert([
      {
        user_id: userId,
        meal: data.meal,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fats: data.fats,
        image_url: data.imageUrl || null,
        created_at: data.timestamp.toISOString(),
        recorded_at: data.recordedAt.toISOString(),
      },
    ]);

  if (error) {
    console.error('❌ Error saving nutrition data:', error);
    throw error;
  }
  
  console.log('✅ Nutrition data saved successfully');
};

export const saveFitnessData = async (data: FitnessActivity, userId: string) => {
  console.log('💾 Saving fitness data:', { userId, activity: data.activity, duration: data.duration });
  
  const { error } = await supabase
    .from('fitness_logs')
    .insert([
      {
        user_id: userId,
        activity: data.activity,
        duration: data.duration,
        calories_burned: data.caloriesBurned,
        created_at: data.timestamp.toISOString(),
        recorded_at: data.recordedAt.toISOString(),
      },
    ]);

  if (error) {
    console.error('❌ Error saving fitness data:', error);
    throw error;
  }
  
  console.log('✅ Fitness data saved successfully');
};

export const getNutritionData = async (userId: string): Promise<NutritionData[]> => {
  console.log('🔍 Fetching nutrition data for user:', userId);
  
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching nutrition data:', error);
    throw error;
  }
  
  console.log('✅ Nutrition data fetched:', data?.length || 0, 'records');

  return data.map((item: any) => ({
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fats: item.fats,
    meal: item.meal,
    imageUrl: item.image_url,
    timestamp: new Date(item.created_at),
    recordedAt: new Date(item.recorded_at),
  }));
};

export const getFitnessData = async (userId: string): Promise<FitnessActivity[]> => {
  console.log('🔍 Fetching fitness data for user:', userId);
  
  const { data, error } = await supabase
    .from('fitness_logs')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching fitness data:', error);
    throw error;
  }
  
  console.log('✅ Fitness data fetched:', data?.length || 0, 'records');

  return data.map((item: any) => ({
    activity: item.activity,
    duration: item.duration,
    caloriesBurned: item.calories_burned,
    timestamp: new Date(item.created_at),
    recordedAt: new Date(item.recorded_at),
  }));
};

export const getWeeklyData = async (userId: string, weeksBack: number = 0): Promise<WeeklyAnalysis> => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - (weeksBack * 7));
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // 7 days total
  
  // Set to start/end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Get nutrition data for the week
  const { data: nutritionData, error: nutritionError } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', startDate.toISOString())
    .lte('recorded_at', endDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (nutritionError) throw nutritionError;

  // Get fitness data for the week
  const { data: fitnessData, error: fitnessError } = await supabase
    .from('fitness_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', startDate.toISOString())
    .lte('recorded_at', endDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (fitnessError) throw fitnessError;

  // Process the data
  const dailyBreakdown: WeeklyAnalysis['dailyBreakdown'] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayNutrition = nutritionData.filter(item => 
      new Date(item.recorded_at).toISOString().split('T')[0] === dateStr
    );
    
    const dayFitness = fitnessData.filter(item => 
      new Date(item.recorded_at).toISOString().split('T')[0] === dateStr
    );
    
    dailyBreakdown.push({
      date: dateStr,
      calories: dayNutrition.reduce((sum, item) => sum + item.calories, 0),
      protein: dayNutrition.reduce((sum, item) => sum + item.protein, 0),
      carbs: dayNutrition.reduce((sum, item) => sum + item.carbs, 0),
      fats: dayNutrition.reduce((sum, item) => sum + item.fats, 0),
      workouts: dayFitness.length,
      workoutMinutes: dayFitness.reduce((sum, item) => sum + item.duration, 0),
      caloriesBurned: dayFitness.reduce((sum, item) => sum + item.calories_burned, 0),
    });
  }

  const totalCalories = dailyBreakdown.reduce((sum, day) => sum + day.calories, 0);
  const totalProtein = dailyBreakdown.reduce((sum, day) => sum + day.protein, 0);
  const totalCarbs = dailyBreakdown.reduce((sum, day) => sum + day.carbs, 0);
  const totalFats = dailyBreakdown.reduce((sum, day) => sum + day.fats, 0);
  const totalWorkouts = dailyBreakdown.reduce((sum, day) => sum + day.workouts, 0);
  const totalWorkoutMinutes = dailyBreakdown.reduce((sum, day) => sum + day.workoutMinutes, 0);
  const totalCaloriesBurned = dailyBreakdown.reduce((sum, day) => sum + day.caloriesBurned, 0);

  return {
    totalCalories,
    avgDailyCalories: Math.round(totalCalories / 7),
    totalProtein,
    totalCarbs,
    totalFats,
    totalWorkouts,
    totalWorkoutMinutes,
    totalCaloriesBurned,
    avgDailyCaloriesBurn: Math.round(totalCaloriesBurned / 7),
    dailyBreakdown,
  };
};

export const uploadFoodImage = async (imageData: string, userId: string): Promise<string> => {
  // Convert base64 to blob
  const base64Data = imageData.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });

  const fileName = `${userId}/${Date.now()}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('food-images')
    .upload(fileName, blob);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('food-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
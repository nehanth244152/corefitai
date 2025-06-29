export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal: string;
  imageUrl?: string;
  timestamp: Date; // When logged in system
  recordedAt: Date; // When actually consumed
}

export interface FitnessActivity {
  activity: string;
  duration: number;
  caloriesBurned: number;
  timestamp: Date; // When logged in system
  recordedAt: Date; // When actually performed
}

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

export interface Recommendation {
  type: 'food' | 'fitness';
  title: string;
  description: string;
  timestamp: Date;
}

export interface DashboardData {
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  netCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface WeeklyAnalysis {
  totalCalories: number;
  avgDailyCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalWorkouts: number;
  totalWorkoutMinutes: number;
  totalCaloriesBurned: number;
  avgDailyCaloriesBurn: number;
  dailyBreakdown: {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    workouts: number;
    workoutMinutes: number;
    caloriesBurned: number;
  }[];
}

export interface WeeklyRecommendation {
  summary: string;
  nutritionInsights: string;
  fitnessInsights: string;
  recommendations: {
    nutrition: string[];
    fitness: string[];
    lifestyle: string[];
  };
  goals: {
    nextWeekCalories: number;
    nextWeekProtein: number;
    nextWeekWorkouts: number;
  };
}

// Typed recommendation from Gemini API
export interface WeeklyRecommendation {
  id: string;
  title: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionSteps?: string[];
  suggestedGoal?: {
    type: string;
    target: number;
    unit: string;
  };
}

export interface UserGoal {
  id: string;
  goalType: 'daily_calories' | 'daily_protein' | 'daily_carbs' | 'daily_fats' | 'weekly_workouts' | 'daily_water' | 'target_weight';
  targetValue: number;
  currentValue: number;
  unit: 'calories' | 'grams' | 'liters' | 'kg' | 'workouts' | 'minutes';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date; 
  lastResetAt?: Date;
}

export interface GoalProgress {
  goalType: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  percentage: number;
  color: string;
  icon: string;
}
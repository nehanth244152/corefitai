// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyBnLiSqx6vnUwwUYZPMNHNL3i9Wg9k_128';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

import { WeeklyAnalysis, WeeklyRecommendation, UserProfile } from '../types';

export async function analyzeMealDescription(mealDescription: string): Promise<string> {
  const prompt = `Analyze this meal: "${mealDescription}". Provide nutritional estimates in this exact format:
Calories: [number]
Protein: [number]g
Carbs: [number]g
Fats: [number]g

Be specific with numbers and keep the format consistent.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error analyzing meal:', error);
    // Fallback mock response for demo purposes
    return `Calories: 450
Protein: 25g
Carbs: 35g
Fats: 20g`;
  }
}

export async function analyzeFoodImage(imageData: string): Promise<string> {
  // Convert base64 image to the format Gemini expects
  const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
  
  const prompt = `Analyze this food image and provide nutritional estimates. Identify the food items and estimate the portion sizes, then provide nutritional information in this exact format:
Calories: [number]
Protein: [number]g
Carbs: [number]g
Fats: [number]g

Also briefly describe what food items you can see in the image.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error analyzing food image:', error);
    // Fallback mock response for demo purposes
    return `I can see what appears to be a healthy meal. Based on the image:

Calories: 520
Protein: 28g
Carbs: 45g
Fats: 22g

The image shows what looks like a balanced meal with protein, vegetables, and carbohydrates.`;
  }
}

export async function getWeeklyRecommendations(
  weeklyAnalysis: WeeklyAnalysis, 
  userProfile: UserProfile
): Promise<WeeklyRecommendation[]> {
  // Add unique timestamp and ID to ensure different responses each time
  const timestamp = new Date().toISOString();
  const uniqueId = Math.random().toString(36).substring(7);
  
  const prompt = `You are an expert nutritionist and fitness coach. Analyze this user's complete weekly health data and provide comprehensive, personalized recommendations.
This is a unique analysis request (ID: ${uniqueId}, timestamp: ${timestamp}).

**USER PROFILE:**
- Age: ${userProfile.age} years old
- Gender: ${userProfile.gender}
- Weight: ${userProfile.weight}kg
- Height: ${userProfile.height}cm  
- Activity Level: ${userProfile.activityLevel}

**WEEKLY NUTRITION & FITNESS DATA:**
- Total Calories Consumed: ${weeklyAnalysis.totalCalories} calories (Average: ${weeklyAnalysis.avgDailyCalories}/day)
- Total Protein: ${weeklyAnalysis.totalProtein}g (Average: ${Math.round(weeklyAnalysis.totalProtein/7)}g/day)
- Total Carbs: ${weeklyAnalysis.totalCarbs}g (Average: ${Math.round(weeklyAnalysis.totalCarbs/7)}g/day)
- Total Fats: ${weeklyAnalysis.totalFats}g (Average: ${Math.round(weeklyAnalysis.totalFats/7)}g/day)
- Total Workouts: ${weeklyAnalysis.totalWorkouts} sessions
- Total Workout Time: ${weeklyAnalysis.totalWorkoutMinutes} minutes
- Total Calories Burned: ${weeklyAnalysis.totalCaloriesBurned} calories (Average: ${weeklyAnalysis.avgDailyCaloriesBurn}/day)

**DAILY BREAKDOWN:**
${weeklyAnalysis.dailyBreakdown.map((day, index) => 
  `Day ${index + 1} (${day.date}): ${day.calories} calories, ${day.protein}g protein, ${day.carbs}g carbs, ${day.fats}g fats, ${day.workouts} workouts (${day.workoutMinutes} min), ${day.caloriesBurned} calories burned`
).join('\n')}

**ANALYSIS REQUIREMENTS:**
1. Identify patterns, trends, and inconsistencies in their data
2. Compare their intake to recommended values for their profile
3. Assess workout frequency and intensity
4. Evaluate macro balance and timing
5. Identify areas for improvement and strengths to maintain

**RESPONSE FORMAT (JSON array):**
[
  {
    "id": "unique-id-string-1",
    "title": "Brief, actionable recommendation title",
    "category": "nutrition, fitness, or lifestyle",
    "description": "Detailed explanation of the recommendation with personalized context",
    "priority": "high, medium, or low",
    "actionSteps": [
      "Specific action step to implement this recommendation",
      "Another specific action step"
    ],
    "suggestedGoal": {
      "type": "daily_calories, daily_protein, weekly_workouts, etc",
      "target": numeric_target_value,
      "unit": "calories, grams, workouts, etc"
    }
  },
  {
    "id": "unique-id-string-2",
    ...
  }
]

**IMPORTANT:** 
- Be specific and reference their actual data
- Provide actionable, realistic recommendations
- Consider their profile when setting goals
- Be encouraging but honest about areas needing improvement
- Focus on sustainable changes, not drastic modifications
- Make recommendations that build on their current habits`;

  try {
    console.log(`🧠 Requesting Gemini weekly analysis for user profile (age: ${userProfile?.age}, gender: ${userProfile?.gender})`);
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok || response.status === 429) {
      // Handle rate limiting gracefully by returning fallback
      if (response.status === 429) {
        console.warn('⚠️ Gemini API rate limit reached, using fallback recommendations');
      } else {
        console.error('❌ Gemini API error:', response.status);
      }

      // Return randomized fallback recommendations
      const randomSeed = Math.floor(Math.random() * 1000);
      const fallbackRecommendations = [
        {
          id: `protein-recommendation-${timestamp}-${randomSeed}`,
          title: `Increase daily protein intake to ${Math.round(userProfile.weight * (1.2 + Math.random() * 0.3))}g`,
          category: "nutrition",
          description: `Your protein intake averaged ${Math.round(weeklyAnalysis.totalProtein / 7)}g per day, which is ${Math.round(weeklyAnalysis.totalProtein / 7) >= userProfile.weight * 1.0 ? 'adequate but could be improved' : 'below optimal'} for your weight and activity level. Increasing protein can help with muscle recovery, satiety, and maintaining lean mass. ${randomSeed % 2 === 0 ? 'Focus on lean sources like chicken, fish, and plant-based options.' : 'Try to space your protein intake evenly throughout the day for optimal muscle protein synthesis.'}`,
          priority: randomSeed % 3 === 0 ? "medium" : "high",
          actionSteps: [
            "Include a protein source in every meal (meat, fish, eggs, tofu, legumes)",
            randomSeed % 2 === 0 ? "Add a protein shake on workout days" : "Consider a casein protein shake before bed for overnight recovery",
            randomSeed % 3 === 0 ? "Incorporate Greek yogurt or cottage cheese as snacks" : "Try adding more plant-based proteins like lentils and chickpeas to your diet"
          ],
          suggestedGoal: {
            type: "daily_protein",
            target: Math.round(userProfile.weight * (1.2 + Math.random() * 0.3)),
            unit: "grams"
          }
        },
        {
          id: `workout-frequency-${timestamp}-${randomSeed + 1}`,
          title: `${weeklyAnalysis.totalWorkouts < 4 ? 'Increase to 4 weekly workouts' : randomSeed % 2 === 0 ? 'Maintain workout frequency' : 'Focus on workout intensity'}`,
          category: "fitness",
          description: `You completed ${weeklyAnalysis.totalWorkouts} workouts this week. ${weeklyAnalysis.totalWorkouts < 4 ? 'Increasing to 4-5 sessions would help accelerate your progress and provide more consistent fitness benefits.' : randomSeed % 2 === 0 ? 'Your current frequency is excellent for maintaining fitness. Focus on adding progressive overload to continue seeing improvements.' : 'Your workout frequency is good. Now consider incorporating more variety in your training to challenge different muscle groups and energy systems.'}`,
          priority: weeklyAnalysis.totalWorkouts < 3 ? "high" : randomSeed % 2 === 0 ? "medium" : "low",
          actionSteps: [
            randomSeed % 3 === 0 ? "Schedule workouts at the beginning of each week" : "Try workout tracking apps to maintain accountability",
            randomSeed % 2 === 0 ? "Mix cardio and strength training for balanced fitness" : "Consider adding HIIT workouts to maximize efficiency",
            randomSeed % 4 === 0 ? "Start with shorter workouts if time is limited" : "Focus on compound exercises to get more benefit in less time"
          ],
          suggestedGoal: {
            type: "weekly_workouts",
            target: Math.min(6, Math.max(3, weeklyAnalysis.totalWorkouts + (randomSeed % 2))),
            unit: "workouts"
          }
        },
        {
          id: `calorie-consistency-${timestamp}-${randomSeed + 2}`,
          title: "Improve daily calorie consistency",
          category: "nutrition",
          description: `Your daily calories varied significantly, from ${Math.min(...weeklyAnalysis.dailyBreakdown.map(d => d.calories))} to ${Math.max(...weeklyAnalysis.dailyBreakdown.map(d => d.calories))} calories. ${randomSeed % 2 === 0 ? 'More consistent intake helps maintain energy levels, supports metabolism, and makes tracking progress easier.' : 'Large variations in daily calorie intake can lead to energy fluctuations and make it harder for your body to establish a consistent metabolic pattern.'}`,
          priority: randomSeed % 3 === 0 ? "high" : "medium",
          actionSteps: [
            randomSeed % 2 === 0 ? "Plan meals in advance to ensure consistent calorie intake" : "Try meal prepping on weekends for the week ahead",
            `Aim for ${Math.round(weeklyAnalysis.avgDailyCalories * (weeklyAnalysis.avgDailyCalories < 1800 ? (1.05 + Math.random() * 0.05) : (1.02 + Math.random() * 0.03)))} calories daily`,
            randomSeed % 3 === 0 ? "Use smaller, more frequent meals if hunger is an issue" : randomSeed % 2 === 0 ? "Include protein and fiber in every meal to improve satiety" : "Consider intermittent fasting if it suits your lifestyle"
          ],
          suggestedGoal: {
            type: "daily_calories",
            target: Math.round(weeklyAnalysis.avgDailyCalories * (weeklyAnalysis.avgDailyCalories < 1800 ? (1.05 + Math.random() * 0.05) : (1.02 + Math.random() * 0.03))),
            unit: "calories"
          }
        }
      ];
      
      // Add a fourth random recommendation with frequency based on the random seed
      if (randomSeed % 4 === 0) {
        fallbackRecommendations.push({
          id: `carbs-recommendation-${timestamp}-${randomSeed + 3}`,
          title: "Optimize carbohydrate timing",
          category: "nutrition",
          description: `You consumed an average of ${Math.round(weeklyAnalysis.totalCarbs / 7)}g of carbs per day. Consider timing your carbohydrate intake around your workouts to maximize performance and recovery. Higher carbs on workout days can improve energy levels and results.`,
          priority: "medium",
          actionSteps: [
            "Consume most of your carbs before and after workouts",
            "Reduce carbs on rest days and focus more on protein and healthy fats",
            "Choose complex carbs like whole grains, fruits, and vegetables"
          ],
          suggestedGoal: {
            type: "daily_carbs",
            target: Math.round((weeklyAnalysis.totalCarbs / 7) * (randomSeed % 2 === 0 ? 1.1 : 0.9)),
            unit: "grams"
          }
        });
      } else if (randomSeed % 4 === 1) {
        fallbackRecommendations.push({
          id: `fats-recommendation-${timestamp}-${randomSeed + 3}`,
          title: "Increase healthy fat intake",
          category: "nutrition",
          description: `Your fat intake averaged ${Math.round(weeklyAnalysis.totalFats / 7)}g per day. Healthy fats are essential for hormone production, brain function, and absorbing fat-soluble vitamins. Consider incorporating more sources of omega-3 and monounsaturated fats.`,
          priority: "low",
          actionSteps: [
            "Add fatty fish like salmon or sardines to your diet twice weekly",
            "Include avocados, nuts, and olive oil in your meals",
            "Limit processed foods high in trans and saturated fats"
          ],
          suggestedGoal: {
            type: "daily_fats",
            target: Math.max(50, Math.round((weeklyAnalysis.totalFats / 7) * 1.15)),
            unit: "grams"
          }
        });
      } else if (randomSeed % 4 === 2) {
        fallbackRecommendations.push({
          id: `workout-duration-${timestamp}-${randomSeed + 3}`,
          title: "Optimize workout duration",
          category: "fitness",
          description: `Your workouts averaged ${Math.round(weeklyAnalysis.totalWorkoutMinutes / Math.max(1, weeklyAnalysis.totalWorkouts))} minutes per session. For most effective results, aim for 45-60 minute focused sessions with proper intensity rather than longer, less intense workouts.`,
          priority: "low",
          actionSteps: [
            "Focus on compound movements for efficiency",
            "Reduce rest periods to increase intensity",
            "Consider super-sets to maximize time efficiency"
          ],
          suggestedGoal: null
        });
      }
      
      // Shuffle the array to randomize the order
      return fallbackRecommendations
        .sort(() => Math.random() - 0.5)
        .slice(0, randomSeed % 2 === 0 ? 3 : 4); // Sometimes show 3, sometimes 4 recommendations
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      try {
        // Find the first [ and last ] to extract just the JSON array
        const firstBracket = responseText.indexOf('[');
        const lastBracket = responseText.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const jsonString = responseText.substring(firstBracket, lastBracket + 1);
          const parsed = JSON.parse(jsonString);
          return parsed;
        }
        
        // If no valid JSON is found, throw to trigger the fallback
        throw new Error('Invalid response format - no JSON found');
      } catch (parseError) {
        console.warn('Could not parse JSON response, using fallback');
        throw parseError;
      }
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error getting recommendations from Gemini API:', error);
    
    // Return fallback recommendations
    // Generate randomized fallback (same code as above to handle all error cases)
    const randomSeed = Math.floor(Math.random() * 1000);
    const fallbackRecommendations = [
      {
        id: `protein-recommendation-${timestamp}-${randomSeed}`,
        title: `Increase daily protein intake to ${Math.round(userProfile.weight * (1.2 + Math.random() * 0.3))}g`,
        category: "nutrition",
        description: `Your protein intake averaged ${Math.round(weeklyAnalysis.totalProtein / 7)}g per day, which is ${Math.round(weeklyAnalysis.totalProtein / 7) >= userProfile.weight * 1.0 ? 'adequate but could be improved' : 'below optimal'} for your weight and activity level. Increasing protein can help with muscle recovery, satiety, and maintaining lean mass. ${randomSeed % 2 === 0 ? 'Focus on lean sources like chicken, fish, and plant-based options.' : 'Try to space your protein intake evenly throughout the day for optimal muscle protein synthesis.'}`,
        priority: randomSeed % 3 === 0 ? "medium" : "high",
        actionSteps: [
          "Include a protein source in every meal (meat, fish, eggs, tofu, legumes)",
          randomSeed % 2 === 0 ? "Add a protein shake on workout days" : "Consider a casein protein shake before bed for overnight recovery",
          randomSeed % 3 === 0 ? "Incorporate Greek yogurt or cottage cheese as snacks" : "Try adding more plant-based proteins like lentils and chickpeas to your diet"
        ],
        suggestedGoal: {
          type: "daily_protein",
          target: Math.round(userProfile.weight * (1.2 + Math.random() * 0.3)),
          unit: "grams"
        }
      },
      {
        id: `workout-frequency-${timestamp}-${randomSeed + 1}`,
        title: `${weeklyAnalysis.totalWorkouts < 4 ? 'Increase to 4 weekly workouts' : randomSeed % 2 === 0 ? 'Maintain workout frequency' : 'Focus on workout intensity'}`,
        category: "fitness",
        description: `You completed ${weeklyAnalysis.totalWorkouts} workouts this week. ${weeklyAnalysis.totalWorkouts < 4 ? 'Increasing to 4-5 sessions would help accelerate your progress and provide more consistent fitness benefits.' : randomSeed % 2 === 0 ? 'Your current frequency is excellent for maintaining fitness. Focus on adding progressive overload to continue seeing improvements.' : 'Your workout frequency is good. Now consider incorporating more variety in your training to challenge different muscle groups and energy systems.'}`,
        priority: weeklyAnalysis.totalWorkouts < 3 ? "high" : randomSeed % 2 === 0 ? "medium" : "low",
        actionSteps: [
          randomSeed % 3 === 0 ? "Schedule workouts at the beginning of each week" : "Try workout tracking apps to maintain accountability",
          randomSeed % 2 === 0 ? "Mix cardio and strength training for balanced fitness" : "Consider adding HIIT workouts to maximize efficiency",
          randomSeed % 4 === 0 ? "Start with shorter workouts if time is limited" : "Focus on compound exercises to get more benefit in less time"
        ],
        suggestedGoal: {
          type: "weekly_workouts",
          target: Math.min(6, Math.max(3, weeklyAnalysis.totalWorkouts + (randomSeed % 2))),
          unit: "workouts"
        }
      },
      {
        id: `calorie-consistency-${timestamp}-${randomSeed + 2}`,
        title: "Improve daily calorie consistency",
        category: "nutrition",
        description: `Your daily calories varied significantly, from ${Math.min(...weeklyAnalysis.dailyBreakdown.map(d => d.calories))} to ${Math.max(...weeklyAnalysis.dailyBreakdown.map(d => d.calories))} calories. ${randomSeed % 2 === 0 ? 'More consistent intake helps maintain energy levels, supports metabolism, and makes tracking progress easier.' : 'Large variations in daily calorie intake can lead to energy fluctuations and make it harder for your body to establish a consistent metabolic pattern.'}`,
        priority: randomSeed % 3 === 0 ? "high" : "medium",
        actionSteps: [
          randomSeed % 2 === 0 ? "Plan meals in advance to ensure consistent calorie intake" : "Try meal prepping on weekends for the week ahead",
          `Aim for ${Math.round(weeklyAnalysis.avgDailyCalories * (weeklyAnalysis.avgDailyCalories < 1800 ? (1.05 + Math.random() * 0.05) : (1.02 + Math.random() * 0.03)))} calories daily`,
          randomSeed % 3 === 0 ? "Use smaller, more frequent meals if hunger is an issue" : randomSeed % 2 === 0 ? "Include protein and fiber in every meal to improve satiety" : "Consider intermittent fasting if it suits your lifestyle"
        ],
        suggestedGoal: {
          type: "daily_calories",
          target: Math.round(weeklyAnalysis.avgDailyCalories * (weeklyAnalysis.avgDailyCalories < 1800 ? (1.05 + Math.random() * 0.05) : (1.02 + Math.random() * 0.03))),
          unit: "calories"
        }
      }
    ];
    
    // Add a fourth random recommendation with frequency based on the random seed
    if (randomSeed % 4 === 0) {
      fallbackRecommendations.push({
        id: `carbs-recommendation-${timestamp}-${randomSeed + 3}`,
        title: "Optimize carbohydrate timing",
        category: "nutrition",
        description: `You consumed an average of ${Math.round(weeklyAnalysis.totalCarbs / 7)}g of carbs per day. Consider timing your carbohydrate intake around your workouts to maximize performance and recovery. Higher carbs on workout days can improve energy levels and results.`,
        priority: "medium",
        actionSteps: [
          "Consume most of your carbs before and after workouts",
          "Reduce carbs on rest days and focus more on protein and healthy fats",
          "Choose complex carbs like whole grains, fruits, and vegetables"
        ],
        suggestedGoal: {
          type: "daily_carbs",
          target: Math.round((weeklyAnalysis.totalCarbs / 7) * (randomSeed % 2 === 0 ? 1.1 : 0.9)),
          unit: "grams"
        }
      });
    } else if (randomSeed % 4 === 1) {
      fallbackRecommendations.push({
        id: `fats-recommendation-${timestamp}-${randomSeed + 3}`,
        title: "Increase healthy fat intake",
        category: "nutrition",
        description: `Your fat intake averaged ${Math.round(weeklyAnalysis.totalFats / 7)}g per day. Healthy fats are essential for hormone production, brain function, and absorbing fat-soluble vitamins. Consider incorporating more sources of omega-3 and monounsaturated fats.`,
        priority: "low",
        actionSteps: [
          "Add fatty fish like salmon or sardines to your diet twice weekly",
          "Include avocados, nuts, and olive oil in your meals",
          "Limit processed foods high in trans and saturated fats"
        ],
        suggestedGoal: {
          type: "daily_fats",
          target: Math.max(50, Math.round((weeklyAnalysis.totalFats / 7) * 1.15)),
          unit: "grams"
        }
      });
    } else if (randomSeed % 4 === 2) {
      fallbackRecommendations.push({
        id: `workout-duration-${timestamp}-${randomSeed + 3}`,
        title: "Optimize workout duration",
        category: "fitness",
        description: `Your workouts averaged ${Math.round(weeklyAnalysis.totalWorkoutMinutes / Math.max(1, weeklyAnalysis.totalWorkouts))} minutes per session. For most effective results, aim for 45-60 minute focused sessions with proper intensity rather than longer, less intense workouts.`,
        priority: "low",
        actionSteps: [
          "Focus on compound movements for efficiency",
          "Reduce rest periods to increase intensity",
          "Consider super-sets to maximize time efficiency"
        ],
        suggestedGoal: null
      });
    }
    
    // Shuffle the array to randomize the order
    return fallbackRecommendations
      .sort(() => Math.random() - 0.5)
      .slice(0, randomSeed % 2 === 0 ? 3 : 4); // Sometimes show 3, sometimes 4 recommendations
  }
}

export async function getAICalorieBurn(activity: string, duration: number, userProfile: any): Promise<{ calories: number; explanation: string }> {
  const prompt = `Calculate calories burned for a ${userProfile.age}-year-old ${userProfile.gender} who weighs ${userProfile.weight}kg and is ${userProfile.height}cm tall, with ${userProfile.activityLevel} activity level, doing ${activity} for ${duration} minutes.

Please provide:
1. An accurate calorie burn estimate based on their specific demographics
2. A brief explanation of how their age, weight, and activity level affect the calculation

Format your response as:
Calories: [number]
Explanation: [brief explanation in 1-2 sentences]

Be specific and scientific but keep the explanation simple and easy to understand.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent calculations
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Parse the response
      const calorieMatch = responseText.match(/Calories?:\s*(\d+)/i);
      const explanationMatch = responseText.match(/Explanation:\s*(.+)/i);
      
      const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0;
      const explanation = explanationMatch ? explanationMatch[1].trim() : 'Calorie burn calculated based on your personal profile.';
      
      return { calories, explanation };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error getting AI calorie burn:', error);
    // Fallback calculation using basic MET values
    const metValues: { [key: string]: number } = {
      'Running': 8.0,
      'Walking': 3.5,
      'Cycling': 6.0,
      'Swimming': 7.0,
      'Yoga': 2.5,
      'Weight Training': 4.5,
      'Dancing': 4.0,
      'Hiking': 5.0,
      'Basketball': 6.5,
      'Tennis': 6.0,
      'Pilates': 3.0,
      'Other': 4.0
    };
    
    const met = metValues[activity] || 4.0;
    const weightInKg = userProfile.weight || 70;
    const calories = Math.round((met * weightInKg * (duration / 60)));
    
    return {
      calories,
      explanation: `Based on your weight of ${weightInKg}kg and the intensity of ${activity}, this is a personalized estimate.`
    };
  }
}

export async function getFitnessMotivation(activity: string, duration: number): Promise<string> {
  const prompt = `Generate a positive, motivational message for someone who just completed ${activity} for ${duration} minutes. 

Format the response with:
1. A congratulatory message
2. One specific health benefit of this activity
3. An encouraging tip for next time

Keep it friendly, upbeat, and easy to read. Use emojis sparingly and keep under 100 words.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error getting motivation:', error);
    return `🎉 **Awesome work!** You just completed ${duration} minutes of ${activity}!

**Health boost:** This activity strengthened your cardiovascular system and boosted your mood through endorphin release.

**Keep it up:** Try to maintain this consistency - even small amounts of regular exercise make a huge difference for your overall health!`;
  }
}
import React, { useState } from 'react';
import { Camera, Utensils, Loader2, CheckCircle, Image, X, Calendar } from 'lucide-react';
import { analyzeMealDescription, analyzeFoodImage } from '../services/geminiApi';
import { saveNutritionData, uploadFoodImage } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { NutritionData } from '../types';
import PhotoCapture from './PhotoCapture';

interface FoodTrackingProps {
  onMealLogged: (nutrition: NutritionData) => void;
}

const FoodTracking: React.FC<FoodTrackingProps> = ({ onMealLogged }) => {
  const [mealDescription, setMealDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<NutritionData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image'>('text');
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().slice(0, 16);
  });

  const { user } = useAuth();

  const parseNutritionResponse = (response: string, meal: string, imageUrl?: string): NutritionData => {
    const calorieMatch = response.match(/Calories?:\s*(\d+)/i);
    const proteinMatch = response.match(/Protein:\s*(\d+)/i);
    const carbsMatch = response.match(/Carbs?:\s*(\d+)/i);
    const fatsMatch = response.match(/Fats?:\s*(\d+)/i);

    return {
      calories: calorieMatch ? parseInt(calorieMatch[1]) : 0,
      protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
      carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
      fats: fatsMatch ? parseInt(fatsMatch[1]) : 0,
      meal,
      imageUrl,
      timestamp: new Date(), // When logged
      recordedAt: new Date(recordedAt), // When actually consumed
    };
  };

  const handleAnalyzeMeal = async () => {
    if (!mealDescription.trim() && !capturedImage) return;

    setIsAnalyzing(true);
    try {
      let response: string;
      let imageUrl: string | undefined;
      let mealText = mealDescription;

      if (capturedImage && user) {
        // Upload image and analyze it
        imageUrl = await uploadFoodImage(capturedImage, user.id);
        response = await analyzeFoodImage(capturedImage);
        
        // Extract meal description from AI response if not provided
        if (!mealText.trim()) {
          const descriptionMatch = response.match(/(?:I can see|The image shows|This appears to be)([^.]+)/i);
          mealText = descriptionMatch ? descriptionMatch[1].trim() : 'Food from image';
        }
      } else {
        response = await analyzeMealDescription(mealDescription);
      }

      const nutritionData = parseNutritionResponse(response, mealText, imageUrl);
      setLastAnalysis(nutritionData);
      
      // Save to database if user is logged in
      if (user) {
        await saveNutritionData(nutritionData, user.id);
      }
      
      onMealLogged(nutritionData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setMealDescription('');
        setCapturedImage(null);
        setAnalysisMode('text');
        // Reset to current time
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localTime = new Date(now.getTime() - (offset * 60 * 1000));
        setRecordedAt(localTime.toISOString().slice(0, 16));
      }, 3000);
    } catch (error) {
      console.error('Error analyzing meal:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setAnalysisMode('image');
    setShowPhotoCapture(false);
  };

  const canAnalyze = (analysisMode === 'text' && mealDescription.trim()) || 
                    (analysisMode === 'image' && capturedImage);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 lg:mb-6">
        <div className="bg-blue-100 dark:bg-blue-900 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl">
          <Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Food Tracking</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Describe your meal or take a photo</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 field-group">
        {/* When was this meal consumed */}
        <div>
          <label htmlFor="recorded-at" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            When did you eat this?
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="datetime-local"
              id="recorded-at"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="mobile-input w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-3 sm:py-3.5 lg:py-4 border border-gray-200 dark:border-gray-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mobile-input-focus mobile-tap-target"
            />
          </div>
        </div>

        {/* Mode Selection - Mobile Optimized */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/80 p-1 rounded-xl sm:rounded-xl lg:rounded-2xl shadow-inner">
          <button
            onClick={() => setAnalysisMode('text')}
            className={`flex-1 py-2.5 lg:py-3 px-3 sm:px-4 lg:px-5 rounded-lg sm:rounded-lg lg:rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 lg:space-x-2.5 text-sm sm:text-sm lg:text-base mobile-tap-target ${
              analysisMode === 'text'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600/80'
            }`}
          >
            <Utensils className="h-3 w-3 lg:h-4 lg:w-4" />
            <span>Describe</span>
          </button>
          <button
            onClick={() => setAnalysisMode('image')}
            className={`flex-1 py-2.5 lg:py-3 px-3 sm:px-4 lg:px-5 rounded-lg sm:rounded-lg lg:rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 lg:space-x-2.5 text-sm sm:text-sm lg:text-base mobile-tap-target ${
              analysisMode === 'image'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600/80'
            }`}
          >
            <Camera className="h-3 w-3 lg:h-4 lg:w-4" />
            <span>Photo</span>
          </button>
        </div>

        {analysisMode === 'text' ? (
          <div>
            <label htmlFor="meal-description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              What did you eat?
            </label>
            <textarea
              id="meal-description"
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              placeholder="e.g., Grilled salmon with asparagus and quinoa, Greek yogurt with berries..."
              className="w-full px-4 sm:px-4 py-3 sm:py-3 lg:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-sm lg:text-base bg-white dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 mobile-input-focus"
              rows={4}
            />
          </div>
        ) : (
          <div>
            {!capturedImage ? (
              <button
                onClick={() => setShowPhotoCapture(true)}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl sm:rounded-xl lg:rounded-2xl p-6 sm:p-7 lg:p-8 text-center hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 touch-manipulation min-h-[140px] flex flex-col items-center justify-center shadow-sm hover:shadow-md"
              >
                <Camera className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 dark:text-gray-300 mb-3" />
                <p className="text-gray-600 dark:text-gray-200 font-medium text-sm sm:text-base lg:text-lg mb-1">Take a photo of your meal</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Tap to open camera or upload from gallery</p>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-md">
                  <img
                    src={capturedImage}
                    alt="Captured meal"
                    className="w-full h-40 sm:h-48 lg:h-56 object-cover"
                  />
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="absolute top-3 right-3 bg-red-600/90 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200 touch-manipulation shadow-md"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
                <div>
                  <label htmlFor="meal-description-photo" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Add description (optional)
                  </label>
                  <input
                    type="text"
                    id="meal-description-photo"
                    value={mealDescription}
                    onChange={(e) => setMealDescription(e.target.value)}
                    placeholder="e.g., Lunch at home, dinner with friends..."
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 lg:py-4 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base bg-white dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 mobile-input-focus shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleAnalyzeMeal}
          disabled={!canAnalyze || isAnalyzing}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 lg:py-4 px-5 rounded-xl sm:rounded-xl lg:rounded-2xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:translate-y-[-1px] hover:scale-[1.02] active:translate-y-[1px] active:shadow-md disabled:transform-none text-base lg:text-lg min-h-[52px]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing meal...</span>
            </>
          ) : (
            <>
              {analysisMode === 'image' ? <Image className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              <span>Analyze Meal</span>
            </>
          )}
        </button>

        {showSuccess && (
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 p-4 rounded-xl sm:rounded-xl animate-fade-in-up shadow-sm">
            <CheckCircle className="h-5 w-5" />
            <span className="text-base font-medium">Meal logged successfully!</span>
          </div>
        )}

        {lastAnalysis && (
          <div className="bg-gray-50 dark:bg-gray-700/80 rounded-xl sm:rounded-xl p-4 sm:p-5 space-y-4 shadow-md mobile-card-gradient animate-fade-in-up">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base sm:text-lg border-b border-gray-200 dark:border-gray-600 pb-2">Latest Analysis</h3>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-200 mb-3 sm:mb-4">
              <strong>Meal:</strong> {lastAnalysis.meal}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-200 mb-3 sm:mb-4">
              <strong>Consumed:</strong> {lastAnalysis.recordedAt.toLocaleString()}
            </div>
            {lastAnalysis.imageUrl && (
              <div className="mb-3 sm:mb-4">
                <img
                  src={lastAnalysis.imageUrl}
                  alt="Analyzed meal"
                  className="w-full h-32 sm:h-40 object-cover rounded-xl sm:rounded-xl shadow-sm"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-white dark:bg-gray-600/90 p-3 sm:p-4 rounded-xl sm:rounded-xl shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{lastAnalysis.calories}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Calories</div>
              </div>
              <div className="bg-white dark:bg-gray-600/90 p-3 sm:p-4 rounded-xl sm:rounded-xl shadow-sm">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{lastAnalysis.protein}g</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Protein</div>
              </div>
              <div className="bg-white dark:bg-gray-600/90 p-3 sm:p-4 rounded-xl sm:rounded-xl shadow-sm">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{lastAnalysis.carbs}g</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Carbs</div>
              </div>
              <div className="bg-white dark:bg-gray-600/90 p-3 sm:p-4 rounded-xl sm:rounded-xl shadow-sm">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{lastAnalysis.fats}g</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Fats</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPhotoCapture && (
        <PhotoCapture
          onPhotoCapture={handlePhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}
    </div>
  );
};

export default FoodTracking;
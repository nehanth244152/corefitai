import React, { useState } from 'react';
import { Star, X, Heart, Sparkles } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRating: (rating: number, feedback?: string) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmitRating }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitRating(selectedRating, feedback.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "Rate your experience";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return "text-red-500";
    if (rating === 3) return "text-yellow-500";
    if (rating === 4) return "text-blue-500";
    return "text-green-500";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative border border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-3 rounded-xl w-fit mx-auto mb-4">
            <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">How's your experience?</h2>
          <p className="text-gray-600 dark:text-gray-300">
            You've been using CoreFit.ai for a while now. We'd love to hear your thoughts!
          </p>
        </div>

        <div className="text-center mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2 transition-all duration-200 hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors duration-200 ${
                    rating <= (hoveredRating || selectedRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <p className={`text-lg font-medium transition-colors duration-200 ${
            selectedRating > 0 ? getRatingColor(selectedRating) : 'text-gray-500'
          }`}>
            {getRatingText(hoveredRating || selectedRating)}
          </p>
        </div>

        {selectedRating > 0 && (
          <div className="mb-6">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tell us more (optional)
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                selectedRating >= 4 
                  ? "What do you love most about CoreFit.ai?" 
                  : "How can we improve your experience?"
              }
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {feedback.length}/500 characters
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Maybe Later
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedRating === 0 || isSubmitting}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Submit Rating</span>
              </>
            )}
          </button>
        </div>

        {selectedRating >= 4 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
            <p className="text-green-700 dark:text-green-300 text-sm text-center">
              🎉 Thank you! Your positive feedback helps us improve CoreFit.ai for everyone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingModal;
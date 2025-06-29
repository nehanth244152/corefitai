import React, { useState, useEffect } from 'react';
import { Activity, Brain, Camera, Dumbbell, TrendingUp, Target, Zap, Users, Star, ArrowRight, Sparkles, Loader2, AlertTriangle, RefreshCw, Menu } from 'lucide-react';
import { getAppStats, formatNumber, AppStats } from '../services/statsService';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  onGetStarted: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing stats...');
      loadStats(true); // Silent refresh
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async (silent = false) => {
    try {
      if (!silent) setStatsLoading(true);
      setStatsError(null);
      console.log('🚀 HomePage: Loading app stats...');
      
      const appStats = await getAppStats();
      console.log('📊 HomePage: Stats loaded successfully:', appStats);
      setStats(appStats);
    } catch (error) {
      console.error('💥 HomePage: Error loading stats:', error);
      if (!silent) {
        setStatsError('Unable to load real-time statistics');
      }
      
      // Set fallback stats so the page still works
      setStats({
        totalUsers: 0,
        totalMealsAnalyzed: 0,
        totalWorkouts: 0,
        avgUserRating: 4.2,
        aiAccuracyRate: 88
      });
    } finally {
      if (!silent) setStatsLoading(false);
    }
  };

  const handleRetry = () => {
    loadStats();
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Nutrition Analysis",
      description: "Simply describe your meals or snap a photo. Our advanced AI instantly analyzes nutritional content with precision.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Dumbbell,
      title: "Smart Fitness Tracking",
      description: "Log workouts and get personalized calorie burn estimates based on your unique profile and activity level.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: TrendingUp,
      title: "Weekly AI Insights",
      description: "Receive comprehensive weekly analysis and personalized recommendations powered by Google's Gemini AI.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Personalized Goals",
      description: "Set and track custom health goals with AI-driven recommendations tailored to your lifestyle.",
      gradient: "from-orange-500 to-red-500"
    }
  ];


  // Generate dynamic stats display
  const getDisplayStats = () => {
    if (!stats) return [];

    const totalActivities = stats.totalMealsAnalyzed + stats.totalWorkouts;

    return [
      { 
        number: formatNumber(stats.totalUsers), 
        label: "Users Signed Up" 
      },
      { 
        number: formatNumber(totalActivities), 
        label: "Activities Tracked" 
      },
      { 
        number: `${stats.aiAccuracyRate}%`, 
        label: "AI Accuracy Rate" 
      },
      { 
        number: `${stats.avgUserRating}★`, 
        label: "User Rating" 
      }
    ];
  };

  const displayStats = getDisplayStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header - Mobile Optimized */}
      <header className="relative z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
              onClick={() => window.location.href = '/'}
            >
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">CoreFit.ai</h1>
                <p className="text-xs text-gray-500 hidden sm:block">AI-Powered Fitness</p>
              </div>
            </div>
            
            {/* Mobile Menu */}
            <div className="md:hidden">
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <a 
                href="#features" 
                className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                How It Works
              </a>
              <a 
                href="#pricing" 
                className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Pricing
              </a>
            </div>
            
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[56px]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10"></div>
        <div className="relative max-w-7xl mx-auto py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
                <Brain className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Your Personal
              <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mt-1 sm:mt-2">
                AI Fitness Coach
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
              Snap. Track. Transform. Your personalized path to better health.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-2">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Start Your Journey</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-600 text-sm sm:text-base">
                <div className="flex -space-x-1 sm:-space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <span className="font-medium">
                  {stats && stats.totalUsers > 0 ? `Join ${formatNumber(stats.totalUsers)} users` : 'Join our community'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile Optimized */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {statsLoading ? (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin" />
                <span className="text-gray-600 text-sm sm:text-base">Loading real-time stats...</span>
              </div>
            </div>
          ) : statsError ? (
            <div className="text-center py-6 sm:py-8">
              <div className="flex items-center justify-center space-x-2 text-amber-600 mb-4">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base">{statsError}</span>
              </div>
              
              <button
                onClick={handleRetry}
                className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 mb-4 sm:mb-6 text-sm sm:text-base"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Retry Loading Stats</span>
              </button>
              
              <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Showing platform overview</div>
              
              {/* Show stats even with error */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                {displayStats.map((stat, index) => (
                  <div key={index} className="text-center bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Real-time platform statistics</p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                {displayStats.map((stat, index) => (
                  <div key={index} className="text-center bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-xs text-gray-400">
                  📊 Live data from our database • Updated in real-time
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl sm:max-w-2xl mx-auto">
              Experience the future of fitness tracking with features designed to understand and adapt to your unique needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className={`bg-gradient-to-r ${feature.gradient} p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mb-4 sm:mb-6`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Mobile Optimized */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Simple. Smart. Effective.
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Get started in just three easy steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 shadow-lg">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Capture & Log</h3>
              <p className="text-gray-600 text-sm sm:text-base">Take photos of meals or describe your workouts. Our AI does the rest.</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 shadow-lg">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">2. AI Analysis</h3>
              <p className="text-gray-600 text-sm sm:text-base">Get instant nutritional breakdowns and personalized fitness insights.</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 shadow-lg">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">3. Achieve Goals</h3>
              <p className="text-gray-600 text-sm sm:text-base">Follow AI-powered recommendations to reach your health objectives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile Optimized */}

      {/* CTA Section - Mobile Optimized */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Transform Your Health?
          </h2>
          <h3 className="text-xl sm:text-2xl text-blue-100 mb-4 sm:mb-6">Free Forever!</h3>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto">
            Join thousands of users who have already started their AI-powered fitness journey. 
            Your healthiest self is just one click away.
          </p>
          
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Start Free Today</span>
          </button>
          
          <p className="text-blue-100 text-xs sm:text-sm mt-3 sm:mt-4">No credit card required • Free forever</p>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">CoreFit.ai</div>
                <div className="text-xs sm:text-sm text-gray-400">AI-Powered Fitness</div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-xs sm:text-sm">
                © 2024 CoreFit.ai. Powered by advanced AI technology.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Built with ❤️ for your health journey
              </p>
            </div>
          </div>
          
          {/* Footer Links */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
              <a 
                href="/privacy" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
              >
                Privacy Policy
              </a>
              <span className="text-gray-600 hidden sm:inline">•</span>
              <a 
                href="mailto:support@corefitai.site" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
              >
                Contact Support
              </a>
              <span className="text-gray-600 hidden sm:inline">•</span>
              <a 
                href="mailto:privacy@corefitai.site" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
              >
                Data Protection
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
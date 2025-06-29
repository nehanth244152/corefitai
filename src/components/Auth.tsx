import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowLeft, CheckCircle, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const { signUp, signIn, resetPassword, signInWithGoogle } = useAuth();

  const parseError = (err: any): string => {
    // If the error message contains JSON with a body property
    if (err.message && typeof err.message === 'string') {
      try {
        // Check if the message contains a JSON-like structure
        if (err.message.includes('"body":')) {
          // Extract the body content from the error message
          const bodyMatch = err.message.match(/"body":"([^"]+)"/);
          if (bodyMatch && bodyMatch[1]) {
            // Parse the escaped JSON in the body
            const bodyJson = JSON.parse(bodyMatch[1].replace(/\\"/g, '"'));
            if (bodyJson.message) {
              // Check for specific error messages and provide user-friendly alternatives
              if (bodyJson.message === 'Invalid login credentials') {
                return 'Incorrect email or password. Please try again or create an account if you don\'t have one.';
              }
              return bodyJson.message;
            }
          }
        }
        
        // Try to parse the entire message as JSON
        const parsed = JSON.parse(err.message);
        if (parsed.message) {
          // Check for specific error messages and provide user-friendly alternatives
          if (parsed.message === 'Invalid login credentials') {
            return 'Incorrect email or password. Please try again or create an account if you don\'t have one.';
          }
          return parsed.message;
        }
      } catch {
        // If parsing fails, fall back to the original message
      }
    }
    
    // Return the original error message if no parsing was successful
    return err.message || 'An unexpected error occurred';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // The redirect will happen automatically
    } catch (err: any) {
      setError(parseError(err));
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetLoading(true);
    setResetError('');
    
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(parseError(err));
    } finally {
      setResetLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSuccess(false);
    setResetError('');
    setResetLoading(false);
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 safe-area-inset">
        <div className="max-w-sm sm:max-w-md w-full">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <button
                onClick={resetForgotPasswordState}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="text-sm">Back to Sign In</span>
              </button>
              
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-2.5 sm:p-3 rounded-xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            {resetSuccess ? (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-emerald-900 mb-2">Check your email!</h3>
                  <p className="text-emerald-700 text-sm">
                    We've sent a password reset link to <strong>{resetEmail}</strong>
                  </p>
                  <p className="text-emerald-600 text-xs mt-2">
                    Click the link in the email to reset your password. Check your spam folder if you don't see it within a few minutes.
                  </p>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-xs font-medium mb-1">Not receiving emails?</p>
                    <p className="text-blue-600 text-xs">
                      1. Check your spam/junk folder<br/>
                      2. Wait 2-3 minutes for delivery<br/>
                      3. Make sure the email address is correct<br/>
                      4. Try again with a different email if needed
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={resetForgotPasswordState}
                  className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 text-base"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="email"
                      id="reset-email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 sm:pl-10 pr-4 py-3 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-600 text-sm">{resetError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-base"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Auth View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 safe-area-inset">
      <div className="max-w-sm sm:max-w-md w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-2.5 sm:p-3 rounded-xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {isSignUp ? 'Join CoreFit.ai to track your fitness journey' : 'Sign in to continue your fitness journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-10 pr-4 py-3 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-10 pr-4 py-3 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 sm:py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

         {/* Google Sign In Button */}
         <button
           onClick={handleGoogleSignIn}
           disabled={loading}
           className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 touch-manipulation shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none text-base min-h-[50px]"
         >
           {loading ? (
             <>
               <Loader2 className="h-4 w-4 animate-spin" />
               <span>Connecting to Google...</span>
             </>
           ) : (
             <>
               <div className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 p-1.5 rounded-lg">
                 <Chrome className="h-4 w-4 text-white" />
               </div>
               <span>{isSignUp ? 'Sign up' : 'Sign in'} with Google</span>
             </>
           )}
         </button>

          <div className="mt-6 text-center">
            {!isSignUp && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base block mb-4"
              >
                Forgot your password?
              </button>
            )}
            
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 touch-manipulation text-sm sm:text-base"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
                <a 
                  href="/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
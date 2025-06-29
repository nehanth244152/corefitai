import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, RefreshCw, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PasswordReset: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    const checkResetLink = async () => {
      try {
        console.log('🔍 Checking reset link...');
        const fullUrl = window.location.href;
        console.log('Current URL:', fullUrl);

        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Get tokens from any possible location
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
        const code = urlParams.get('code') || hashParams.get('code');

        const debugData = {
          fullUrl,
          searchParams: window.location.search,
          hash: window.location.hash,
          extractedTokens: {
            accessToken: accessToken ? 'Present' : 'Missing',
            refreshToken: refreshToken ? 'Present' : 'Missing',
            type,
            tokenHash: tokenHash ? 'Present' : 'Missing',
            code: code ? 'Present' : 'Missing'
          },
          timestamp: new Date().toISOString()
        };
        
        setDebugInfo(debugData);
        console.log('📝 Debug info:', debugData);

        // Method 1: Try with access token (most common for Supabase)
        if (accessToken) {
          console.log('🔑 Attempting to set session with access token...');
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (error) {
              console.error('❌ SetSession error:', error);
              // Continue to other methods
            } else if (data.session) {
              console.log('✅ Session established successfully with access token');
              setIsValidLink(true);
              return;
            }
          } catch (sessionError: any) {
            console.warn('⚠️ Session method failed:', sessionError);
          }
        }

        // Method 2: Try OTP verification with token hash
        if (tokenHash) {
          console.log('🔗 Attempting OTP verification with token hash...');
          
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            });

            if (error) {
              console.error('❌ OTP verification error:', error);
            } else if (data.session) {
              console.log('✅ OTP verified and session established');
              setIsValidLink(true);
              return;
            }
          } catch (otpError: any) {
            console.error('❌ OTP verification failed:', otpError);
          }
        }

        // Method 3: Try exchanging the code
        if (code) {
          console.log('🔄 Attempting to exchange auth code...');
          
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('❌ Code exchange error:', error);
            } else if (data.session) {
              console.log('✅ Code exchanged successfully');
              setIsValidLink(true);
              return;
            }
          } catch (codeError: any) {
            console.error('❌ Code exchange failed:', codeError);
          }
        }

        // Method 4: Try to get current session (user might already be logged in)
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('✅ Found existing valid session');
            setIsValidLink(true);
            return;
          }
        } catch (sessionCheckError) {
          console.warn('⚠️ Session check failed:', sessionCheckError);
        }

        // Method 5: Special handling for Supabase magic links
        if (accessToken && type === 'recovery') {
          console.log('🔮 Attempting direct password reset flow...');
          
          try {
            // Try to verify the user directly with the access token
            const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
            
            if (!userError && userData.user) {
              console.log('✅ User verified with access token, allowing password reset');
              setIsValidLink(true);
              return;
            }
          } catch (userError) {
            console.warn('⚠️ Direct user verification failed:', userError);
          }
        }

        // If we get here, the link is invalid
        throw new Error('Unable to establish a valid reset session. The link may be expired, already used, or malformed.');

      } catch (err: any) {
        console.error('💥 Reset link validation failed:', err);
        setError(err.message || 'Invalid reset link. Please request a new password reset.');
        setIsValidLink(false);
      } finally {
        setCheckingLink(false);
      }
    };

    checkResetLink();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Updating password...');
      
      // First, try to update the password with the current session
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        
        // If session is invalid, try to re-establish it with tokens from URL
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        
        if (accessToken && error.message?.includes('session')) {
          console.log('🔄 Re-establishing session for password update...');
          
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: urlParams.get('refresh_token') || ''
            });
            
            // Retry password update
            const { error: retryError } = await supabase.auth.updateUser({
              password: password
            });
            
            if (retryError) {
              throw retryError;
            }
          } catch (retryErr: any) {
            throw new Error('Session expired. Please request a new password reset link.');
          }
        } else {
          throw error;
        }
      }

      console.log('✅ Password updated successfully');
      setSuccess(true);
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (err: any) {
      console.error('💥 Password update failed:', err);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (err.message?.includes('session_not_found') || err.message?.includes('invalid_credentials')) {
        errorMessage = 'Your reset session has expired. Please request a new password reset.';
      } else if (err.message?.includes('same_password')) {
        errorMessage = 'Your new password must be different from your current password.';
      } else if (err.message?.includes('weak_password')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyDebugInfo = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    }
  };

  const requestNewReset = () => {
    window.location.href = '/?forgot-password=true';
  };

  // Loading state while checking the reset link
  if (checkingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4">
              <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Reset Link</h1>
            <p className="text-gray-600">Please wait while we verify your password reset link...</p>
            <div className="mt-4 text-xs text-gray-400">
              Trying multiple authentication methods for compatibility
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state for invalid links
  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Link Issue</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link appears to be invalid or expired.'}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">This usually happens when:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• The link has expired (usually after 1 hour)</li>
                <li>• The link was already used</li>
                <li>• Supabase email configuration needs updating</li>
                <li>• The email was corrupted during delivery</li>
              </ul>
            </div>

            {/* Debug Information Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Technical Details
              </button>
              
              {showDebugInfo && debugInfo && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Debug Information:</span>
                    <button
                      onClick={copyDebugInfo}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={requestNewReset}
                className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 transition-all duration-200"
              >
                Request New Reset Link
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Back to Sign In
              </button>
            </div>
            
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Need help?</h4>
              <p className="text-sm text-blue-700">
                If this keeps happening, there might be a configuration issue with the email system. The debug information above can help diagnose the problem.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-emerald-700 text-sm">Redirecting to sign in page in 3 seconds...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4 shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Password Reset Error</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm text-center">Passwords do not match</p>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
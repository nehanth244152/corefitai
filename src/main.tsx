import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabase.ts';

// Global error handler for Supabase refresh token issues
const handleGlobalError = async (error: any) => {
  // Check multiple possible error formats
  const errorMessage = error?.message || error?.toString() || '';
  const errorBody = error?.body || '';
  const errorCode = error?.code || '';
  
  // Try to parse JSON error if it exists
  let parsedError: any = null;
  try {
    if (typeof errorBody === 'string' && errorBody.startsWith('{')) {
      parsedError = JSON.parse(errorBody);
    } else if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
      // Extract JSON from error message if it contains JSON
      const jsonMatch = errorMessage.match(/\{.*\}/);
      if (jsonMatch) {
        parsedError = JSON.parse(jsonMatch[0]);
      }
    }
  } catch (parseError) {
    // Ignore JSON parsing errors
  }

  // Check for refresh token errors in multiple formats
  const isRefreshTokenError = 
    errorMessage.includes('Invalid Refresh Token: Refresh Token Not Found') ||
    errorMessage.includes('refresh_token_not_found') ||
    errorCode === 'refresh_token_not_found' ||
    parsedError?.code === 'refresh_token_not_found' ||
    parsedError?.message?.includes('refresh_token_not_found') ||
    (error?.status === 400 && errorMessage.includes('refresh_token'));

  if (isRefreshTokenError) {
    console.warn('🔄 Detected invalid refresh token, clearing session and reloading...');
    
    try {
      // Sign out the user to clear the corrupted session
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Error during sign out:', signOutError);
    }
    
    // Reload the page to start fresh
    window.location.reload();
  }
};

// Listen for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  handleGlobalError(event.reason);
});

// Listen for regular errors
window.addEventListener('error', (event) => {
  handleGlobalError(event.error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
# 🚨 URGENT: Fix Google OAuth redirect_uri_mismatch Error

## The Problem
Google OAuth is showing "Error 400: redirect_uri_mismatch" because your Google Cloud Console isn't configured with the correct Supabase redirect URI.

## IMMEDIATE Fix Required

### 1. Get Your Supabase Project URL
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Project URL** (it looks like: `https://xxx.supabase.co`)

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**

#### If you DON'T have OAuth credentials yet:
1. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
2. Choose **Web application**
3. Name: "CoreFit.ai"

#### Configure the redirect URIs:
4. In **Authorized JavaScript origins**, add:
   ```
   https://corefitai.site
   http://localhost:5173
   ```

5. In **Authorized redirect URIs**, add:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   ```
   
   **Replace `[YOUR_SUPABASE_PROJECT_ID]` with your actual Supabase project URL**
   
   For example, if your Supabase URL is `https://abcdefghijk.supabase.co`, then add:
   ```
   https://abcdefghijk.supabase.co/auth/v1/callback
   ```

6. Click **Save**
7. Copy the **Client ID** and **Client Secret**

### 3. Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Authentication** → **Providers**
3. Find **Google** and toggle it **ON**
4. Paste your **Client ID** and **Client Secret** from Google Console
5. The **Redirect URL** should show: `https://[your-project].supabase.co/auth/v1/callback`
6. Click **Save**

### 4. Set Up OAuth Consent Screen (if not done)

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - **App name**: CoreFit.ai
   - **User support email**: Your email
   - **App domain**: `https://corefitai.site`
   - **Authorized domains**: Add `corefitai.site` and `supabase.co`
4. Add scopes: `email`, `profile`, `openid`
5. Click **Save and Continue**

### 5. Test the Fix

1. Go to https://corefitai.site
2. Click "Sign in with Google"
3. Should now work without the redirect error

## Quick Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials created
- [ ] Authorized redirect URI includes your Supabase callback URL
- [ ] JavaScript origins include your domain
- [ ] Client ID and Secret added to Supabase
- [ ] Google provider enabled in Supabase
- [ ] OAuth consent screen configured

## Common Issues

**Still getting redirect error?**
- Double-check the redirect URI matches EXACTLY: `https://[project].supabase.co/auth/v1/callback`
- Make sure you saved changes in Google Console
- Try in incognito mode
- Wait 5-10 minutes for Google's changes to propagate

**"This app isn't verified"?**
- In OAuth consent screen, click **"Publish App"**
- Or add test users for development

**Can't find your Supabase project ID?**
- Look at your Supabase dashboard URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`
- Or check **Settings** → **API** in Supabase

The main issue is that Google needs to know the exact Supabase callback URL to allow the OAuth flow!
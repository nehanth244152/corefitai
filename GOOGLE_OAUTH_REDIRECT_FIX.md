# 🚨 URGENT: Fix Google OAuth Redirect URI Mismatch

## The Problem
Error 400: redirect_uri_mismatch - This means the redirect URI Supabase is sending to Google doesn't match what's configured in your Google Cloud Console.

## IMMEDIATE SOLUTION

### Step 1: Get Your Exact Supabase Redirect URI
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers** → **Google**
4. **Copy the exact "Redirect URL"** shown there
   - It should look like: `https://[your-project-id].supabase.co/auth/v1/callback`

### Step 2: Fix Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the **correct project**
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. In **Authorized redirect URIs**, ensure you have EXACTLY:
   ```
   https://[your-supabase-project-id].supabase.co/auth/v1/callback
   ```
   ⚠️ **CRITICAL**: The URI must match EXACTLY - no extra characters, spaces, or differences

### Step 3: Verify Your Configuration
Double-check these settings in Google Cloud Console:

**Authorized JavaScript origins:**
```
https://corefitai.site
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://[your-supabase-project-id].supabase.co/auth/v1/callback
```

### Step 4: Quick Test Method
1. **Save** your changes in Google Cloud Console
2. **Wait 2-3 minutes** (Google needs time to propagate changes)
3. Try the Google sign-in again

## Common Mistakes That Cause This Error

❌ **Wrong redirect URI format:**
- `https://supabase.co/auth/v1/callback` (missing project ID)
- `https://your-project.supabase.co/auth/callback` (missing v1)
- Extra spaces or characters

✅ **Correct format:**
- `https://abcdefghijk.supabase.co/auth/v1/callback`

❌ **Wrong project in Google Console**
- You might be editing the wrong Google Cloud project

❌ **Not saved properly**
- Changes weren't saved in Google Cloud Console

## Backup Solution: Create New OAuth Client

If the above doesn't work in 5 minutes:

1. **Create a completely new OAuth client:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
   - Choose **"Web application"**
   - Name it **"CoreFit.ai Fix"**
   - Add the redirect URIs correctly

2. **Update Supabase:**
   - Copy the new Client ID and Secret
   - Go to Supabase → Authentication → Providers → Google
   - Replace with new credentials
   - Save

## Verification Steps

1. ✅ Copied exact redirect URI from Supabase
2. ✅ Added exact URI to Google Cloud Console
3. ✅ Saved changes in Google Cloud Console
4. ✅ Waited 2-3 minutes
5. ✅ Tested in incognito/private browser window

## Emergency Contact

If this still doesn't work:
- Email: pnehanthp5@gmail.com
- Include: Screenshot of your Google Cloud Console redirect URIs

**This should fix the redirect_uri_mismatch error immediately!**
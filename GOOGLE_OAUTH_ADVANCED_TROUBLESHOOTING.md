# 🔧 Advanced Google OAuth Consent Screen Troubleshooting

## The Issue
Google OAuth is still showing the Supabase URL instead of "CoreFit.ai" even after configuration changes.

## Advanced Troubleshooting Steps

### Step 1: Verify Correct Google Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Check the project selector** at the top - make sure you're in the RIGHT project
3. If you have multiple projects, you might be configuring the wrong one
4. The project name should match what you intended for CoreFit.ai

### Step 2: Check OAuth Application Status
1. Go to **APIs & Services** → **Credentials**
2. Look for your OAuth 2.0 Client ID
3. Click on it and verify:
   - **Name**: Should be something like "CoreFit.ai Web Client"
   - **Authorized JavaScript origins**: Should include `https://corefitai.site`
   - **Authorized redirect URIs**: Should include your Supabase callback URL

### Step 3: Verify OAuth Consent Screen Configuration
1. Go to **APIs & Services** → **OAuth consent screen**
2. **CRITICAL CHECK**: Make sure these fields are filled:
   ```
   App name: CoreFit.ai
   User support email: [your-email]
   App logo: [upload a logo - this helps]
   Application home page: https://corefitai.site
   Application privacy policy link: https://corefitai.site/privacy
   Application terms of service link: https://corefitai.site/privacy
   ```

### Step 4: Publish the App (CRITICAL)
1. In OAuth consent screen, scroll to **Publishing status**
2. Click **"PUBLISH APP"** 
3. Click **"CONFIRM"** 
4. Status should show **"In production"**

### Step 5: Force Refresh Google's Cache
1. After making changes, wait **10-15 minutes**
2. Try in a **different browser** or **incognito mode**
3. Clear your browser cache completely
4. Try the OAuth flow again

### Step 6: Alternative Solution - Create New OAuth Client
If the above doesn't work, create a fresh OAuth client:

1. In **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
3. Choose **"Web application"**
4. Name: **"CoreFit.ai Production"**
5. Set up the URLs correctly:
   ```
   Authorized JavaScript origins:
   - https://corefitai.site
   - http://localhost:5173
   
   Authorized redirect URIs:
   - https://[your-supabase-project].supabase.co/auth/v1/callback
   ```
6. **Copy the new Client ID and Secret**
7. **Update Supabase** with the new credentials:
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Paste the new Client ID and Secret
   - Save

### Step 7: Verify Supabase Configuration
Make sure in Supabase:
1. **Site URL**: `https://corefitai.site`
2. **Redirect URLs** include: `https://corefitai.site`
3. Google provider is enabled with correct credentials

## Quick Diagnosis

**If you see the Supabase URL, it usually means:**
- ❌ App name is empty in Google Console
- ❌ App is not published (still in testing)
- ❌ Wrong Google project is being used
- ❌ OAuth client is misconfigured

## Immediate Actions

1. **Double-check the app name field** - it might be empty
2. **Ensure the app is PUBLISHED** (not in testing mode)
3. **Wait 10-15 minutes** after changes
4. **Test in incognito mode** to avoid cache issues

## Last Resort: Contact Google Support

If nothing works:
1. Go to Google Cloud Console → Support
2. Create a case explaining the OAuth consent screen is showing wrong app name
3. Include your project ID and OAuth client ID

## Verification Checklist

- [ ] Correct Google Cloud project selected
- [ ] App name field populated: "CoreFit.ai"
- [ ] OAuth consent screen published (not testing)
- [ ] OAuth client properly configured
- [ ] Waited 15+ minutes after changes
- [ ] Tested in incognito/different browser
- [ ] Supabase has correct Site URL

The issue is almost certainly in the Google Cloud Console OAuth consent screen configuration. The Supabase URL appears when Google can't find a proper app name.
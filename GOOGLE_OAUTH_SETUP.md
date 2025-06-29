# Google OAuth Setup for CoreFit.ai

## Part 1: Google Console Configuration

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Go to **APIs & Services** → **Credentials**
5. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: CoreFit.ai
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **App domain**: `https://corefitai.site`
   - **Authorized domains**: Add `corefitai.site`
4. Add scopes:
   - `email`
   - `profile`
   - `openid`

### 3. Create OAuth 2.0 Client ID

1. Go back to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Choose **Web application**
3. Name: "CoreFit.ai Web Client"
4. **Authorized JavaScript origins**:
   - `https://corefitai.site`
   - `http://localhost:5173` (for development)
5. **Authorized redirect URIs**:
   - `https://xxx.supabase.co/auth/v1/callback` (replace xxx with your Supabase project)
   - For development: `https://xxx.supabase.co/auth/v1/callback`

### 4. Get Your Credentials
- Copy the **Client ID** and **Client Secret**
- You'll need these for Supabase configuration

---

## Part 2: Supabase Configuration

### 1. Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and toggle it **ON**

### 2. Configure Google Settings

1. Paste your **Google Client ID** from step 1
2. Paste your **Google Client Secret** from step 1
3. **Redirect URL** should be auto-filled: `https://xxx.supabase.co/auth/v1/callback`
4. Click **Save**

### 3. Update Site URL (if not done already)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://corefitai.site`
3. Add **Redirect URLs**:
   - `https://corefitai.site`
   - `https://corefitai.site/auth/callback`
   - `http://localhost:5173` (for development)

---

## Part 3: Code Implementation

The following files will be updated to support Google OAuth:
- `src/contexts/AuthContext.tsx` - Add Google auth methods
- `src/components/Auth.tsx` - Add Google sign-in button
- Add proper error handling and loading states

---

## Testing Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Supabase Google provider enabled
- [ ] Google credentials added to Supabase
- [ ] Site URLs configured correctly
- [ ] Code implemented and tested
- [ ] Google sign-in button appears
- [ ] Google OAuth flow works end-to-end
- [ ] User data is properly stored in Supabase

---

## Common Issues

**"Origin not allowed"**: Check Authorized JavaScript origins in Google Console
**"Redirect URI mismatch"**: Verify redirect URIs match exactly
**"Access blocked"**: OAuth consent screen needs to be published
**"Invalid client"**: Double-check Client ID and Secret in Supabase

Once you complete the Google Console and Supabase configuration, the updated code will handle the Google OAuth flow automatically!
# Google OAuth Troubleshooting Guide

## Common Issues and Solutions

### 1. "Origin not allowed" Error
**Problem**: Google shows "Error 400: redirect_uri_mismatch"

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized JavaScript origins**:
   - `https://corefitai.site`
   - `http://localhost:5173`
5. Add these **Authorized redirect URIs**:
   - `https://[your-supabase-project].supabase.co/auth/v1/callback`
   - Replace `[your-supabase-project]` with your actual project ID

### 2. "Access blocked" Error
**Problem**: Google shows "This app isn't verified"

**Solution**:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **"Publish App"** to make it public
3. Or add test users in **Test users** section for development

### 3. "Invalid client" Error
**Problem**: Authentication fails with invalid client error

**Solution**:
1. Double-check **Client ID** and **Client Secret** in Supabase
2. Make sure they match exactly with Google Console credentials
3. Try regenerating the credentials in Google Console

### 4. Redirect Loop
**Problem**: User gets stuck in redirect loop after Google auth

**Solution**:
1. Check **Site URL** in Supabase matches your domain exactly
2. Ensure **Redirect URLs** include your homepage
3. Clear browser cache and cookies

### 5. Email Already Exists
**Problem**: "User already registered" when signing in with Google

**Solution**:
This happens when:
- User previously signed up with email/password using same email
- Google account email matches existing user

**Fix**: 
1. User should sign in with email/password first
2. Then link Google account in account settings
3. Or: Allow account linking in Supabase settings

### 6. No User Data After Google Auth
**Problem**: User signs in but no profile data is saved

**Solution**:
1. Check if your `users` table trigger is working
2. Verify RLS policies allow inserting user data
3. Check Supabase logs for any errors

## Testing Steps

### Development Testing (localhost:5173)
1. Start local dev server: `npm run dev`
2. Go to `http://localhost:5173`
3. Click "Sign in with Google"
4. Should redirect to Google OAuth
5. After authorization, should redirect back to app

### Production Testing (corefitai.site)
1. Deploy latest changes to Netlify
2. Go to `https://corefitai.site`
3. Test Google OAuth flow
4. Verify user is properly authenticated

## Debugging Tips

### Check Supabase Logs
1. Go to Supabase Dashboard → **Logs** → **Auth**
2. Look for Google OAuth related errors
3. Check for any RLS policy violations

### Browser Console
1. Open browser developer tools
2. Check **Console** tab for JavaScript errors
3. Check **Network** tab for failed requests

### Test with Different Accounts
- Try with different Google accounts
- Test both new and existing users
- Verify email addresses are handled correctly

## Security Considerations

### Production Checklist
- [ ] OAuth consent screen published
- [ ] Authorized domains configured
- [ ] HTTPS enforced on production
- [ ] Sensitive scopes minimized
- [ ] Rate limiting enabled
- [ ] User data properly protected

### Development Best Practices
- Use different OAuth credentials for dev/prod
- Don't commit credentials to version control
- Test with real Google accounts, not test accounts
- Monitor authentication logs regularly

## Advanced Configuration

### Custom Scopes
If you need additional Google data:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile https://www.googleapis.com/auth/fitness.read',
    redirectTo: `${window.location.origin}`,
  },
});
```

### Account Linking
To link Google account to existing email/password account:
```typescript
const { data, error } = await supabase.auth.linkIdentity({
  provider: 'google'
});
```

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Discord Community](https://discord.supabase.com/)

If you're still having issues after following this guide, check the Supabase auth logs and reach out to Supabase support with your project ID and error details.
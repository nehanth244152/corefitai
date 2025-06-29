# Fix Supabase Password Reset Configuration

## The Issue
The password reset link is redirecting to `localhost:3000` but your app runs on `localhost:5173`, and the link is showing as expired.

## Steps to Fix

### 1. Update Supabase URL Configuration

1. Go to your Supabase Dashboard
2. Navigate to `Authentication` → `URL Configuration`
3. Update the **Site URL** to: `https://corefitai.site`
4. Add these **Redirect URLs**:
   - `https://corefitai.site/auth/reset-password`
   - `http://localhost:5173/auth/reset-password` (for development)

### 2. Update Email Template

1. Go to `Authentication` → `Email Templates`
2. Select **Reset Password**
3. Replace the template with:

```html
<h2>Reset Your Password - CoreFit.ai</h2>
<p>Hi there,</p>
<p>You requested to reset your password for your CoreFit.ai account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
<p>Or copy and paste this link in your browser:</p>
<p>{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery</p>
<p><strong>This link will expire in 1 hour.</strong></p>
<p>If you didn't request this password reset, you can safely ignore this email.</p>
<p>Best regards,<br>The CoreFit.ai Team</p>
```

### 3. Check Token Expiry Settings

1. Go to `Settings` → `Authentication`
2. Check **Recovery token expiry** - should be 3600 seconds (1 hour)
3. If needed, increase it to 7200 seconds (2 hours)

### 4. Test Again

1. Clear your browser cache
2. Try the forgot password flow again
3. The email should now contain the correct redirect URL
4. The link should redirect to `https://corefitai.site/auth/reset-password`

### 5. Common Issues & Solutions

**If you're still having issues:**

- **Check spam folder** - password reset emails often go to spam
- **Wait 2-3 minutes** - email delivery can be delayed
- **Try a different email** - some email providers block automated emails
- **Check Supabase logs** - Go to Logs → Auth to see what's happening

### 6. Development vs Production

For development (localhost:5173):
- Temporarily set Site URL to `http://localhost:5173`
- Add redirect URL `http://localhost:5173/auth/reset-password`

For production (corefitai.site):
- Set Site URL to `https://corefitai.site`
- Add redirect URL `https://corefitai.site/auth/reset-password`

## Quick Fix for Testing

If you need to test immediately:
1. Change Supabase Site URL to `https://corefitai.site`
2. Add the production redirect URL
3. Test on the live site instead of localhost

The error you saw (`localhost:3000`) suggests the Supabase configuration is pointing to the wrong URL.
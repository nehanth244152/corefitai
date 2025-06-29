# CRITICAL: Supabase Configuration for Password Reset

## The Problem
Password reset emails are being sent but the links are invalid because Supabase is configured incorrectly.

## EXACT Steps to Fix This

### 1. Go to Supabase Dashboard
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your CoreFit.ai project
3. Go to **Authentication** → **URL Configuration**

### 2. Set Site URL
**IMPORTANT**: Set the **Site URL** to:
```
https://corefitai.site
```
(This is your deployed Netlify site URL)

### 3. Add Redirect URLs
In the **Redirect URLs** section, add BOTH of these:
```
https://corefitai.site/auth/reset-password
http://localhost:5173/auth/reset-password
```

### 4. Configure Email Template
1. Go to **Authentication** → **Email Templates**
2. Click on **"Reset Password"**
3. Replace the ENTIRE template with this:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - CoreFit.ai</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937;">Reset Your Password</h1>
        <p style="color: #6b7280;">CoreFit.ai</p>
    </div>
    
    <p>Hi there,</p>
    
    <p>You requested to reset your password for your CoreFit.ai account. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery" 
           style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); 
                  color: white; 
                  text-decoration: none; 
                  padding: 15px 30px; 
                  border-radius: 8px; 
                  font-weight: bold; 
                  display: inline-block;">
            Reset My Password
        </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link in your browser:<br>
        {{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery
    </p>
    
    <p style="color: #ef4444; font-weight: bold;">⚠️ This link will expire in 1 hour.</p>
    
    <p style="font-size: 14px; color: #6b7280;">
        If you didn't request this password reset, you can safely ignore this email.
    </p>
    
    <p>Best regards,<br>The CoreFit.ai Team</p>
</body>
</html>
```

### 5. Set Email Subject
In the same template, set the **Subject** to:
```
Reset your CoreFit.ai password
```

### 6. Check Authentication Settings
1. Go to **Settings** → **Authentication**
2. Verify these settings:
   - ✅ **Enable email confirmations**: ON
   - ✅ **Recovery token expiry**: 3600 (1 hour)

### 7. Test the Configuration
1. **SAVE ALL CHANGES** in Supabase
2. Wait 2-3 minutes for changes to propagate
3. Go to your live site: https://corefitai.site
4. Click "Forgot Password"
5. Enter your email address
6. Check your email (including spam folder)

## What Should Happen Now

1. **Email arrives** with proper formatting and CoreFit.ai branding
2. **Reset link** points to `https://corefitai.site/auth/reset-password`
3. **Clicking link** opens the password reset form
4. **Password reset** works successfully

## Common Issues & Solutions

### If you still get "Invalid Reset Link":
- Double-check the Site URL is `https://corefitai.site` (no trailing slash)
- Make sure both redirect URLs are added
- Clear your browser cache
- Try in an incognito window

### If email doesn't arrive:
- Check spam/promotions folder
- Wait 3-5 minutes
- Try with a Gmail address (better delivery)
- Verify email template was saved

### If link points to localhost:
- Site URL in Supabase is still set to localhost
- Change it to `https://corefitai.site`

## Testing Checklist
- [ ] Site URL set to `https://corefitai.site`
- [ ] Both redirect URLs added
- [ ] Email template updated and saved
- [ ] Subject line updated
- [ ] Test email sent and received
- [ ] Reset link points to correct domain
- [ ] Password reset form loads
- [ ] Password can be successfully updated

## Support
If you still have issues after following these exact steps:
1. Check Supabase logs: Dashboard → Logs → Auth
2. Contact Supabase support with your project ID
3. Consider switching to custom SMTP for emails

**The key issue was that Supabase was configured for localhost instead of your production domain!**
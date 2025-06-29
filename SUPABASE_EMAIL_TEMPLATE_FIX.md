# Fix Blank Password Reset Email

## The Problem
The password reset email from Supabase is being sent but appears completely blank with no content or reset link.

## Root Cause
The email template in Supabase is either:
- Empty/not configured
- Missing required template variables
- Corrupted after a previous configuration change

## Step-by-Step Fix

### 1. Access Supabase Email Templates
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to `Authentication` → `Email Templates`

### 2. Configure Reset Password Template
1. Click on **"Reset Password"** template
2. **Replace the entire template** with this working template:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - CoreFit.ai</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Reset Your Password</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">CoreFit.ai</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Hi there,
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            You requested to reset your password for your CoreFit.ai account. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 16px 32px; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      font-size: 16px; 
                      display: inline-block;">
                Reset My Password
            </a>
        </div>
        
        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 30px 0;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                Or copy and paste this link in your browser:
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0; word-break: break-all;">
                {{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery
            </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #ef4444; font-size: 14px; margin-bottom: 15px; font-weight: 600;">
                ⚠️ This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The CoreFit.ai Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
```

### 3. Verify Template Variables
Make sure these template variables are present in your template:
- `{{ .SiteURL }}` - Your app's URL
- `{{ .TokenHash }}` - The reset token
- `{{ .RefreshTokenHash }}` - Refresh token
- `{{ .ConfirmationURL }}` - Alternative confirmation URL

### 4. Configure Site URL
1. Go to `Settings` → `API`
2. Set **Site URL** to: `https://corefitai.site`
3. Save the changes

### 5. Add Redirect URLs
1. Go to `Authentication` → `URL Configuration`
2. Add these **Redirect URLs**:
   ```
   https://corefitai.site/auth/reset-password
   http://localhost:5173/auth/reset-password
   ```

### 6. Test Email Template
1. Click **"Send test email"** in the template editor
2. Enter your email address
3. Check if you receive a properly formatted email

## Alternative: Simple Template (If Above Doesn't Work)

If the above template still doesn't work, try this minimal template:

```html
<h2>Reset Your Password</h2>
<p>Click this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery">Reset Password</a></p>
<p>Link: {{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery</p>
<p>If you didn't request this, ignore this email.</p>
```

## Troubleshooting

### If emails are still blank:
1. **Check Supabase project status** - ensure your project is active
2. **Verify email service** - go to Settings → Authentication and check if email is enabled
3. **Check rate limits** - you might have hit Supabase's email rate limit
4. **Try different email** - some providers block automated emails

### If template doesn't save:
1. Make sure you're saving the template (click Save button)
2. Clear browser cache and try again
3. Try using the simple template first

### Common Mistakes:
- ❌ Missing `{{ .SiteURL }}` variable
- ❌ Wrong Site URL configuration
- ❌ Not saving the template after editing
- ❌ Using wrong template variables

## Quick Test
After making these changes:
1. Go to your app's login page
2. Click "Forgot Password"
3. Enter your email
4. Check your email (including spam folder)
5. You should now see a properly formatted email with a working reset link

## Expected Result
The email should contain:
- ✅ Clear subject line
- ✅ Professional formatting
- ✅ Working "Reset Password" button
- ✅ Copy-paste link as backup
- ✅ Expiration warning
- ✅ Clear sender information
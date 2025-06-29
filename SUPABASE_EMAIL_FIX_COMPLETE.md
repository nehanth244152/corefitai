# Complete Fix for Blank Supabase Password Reset Emails

## The Issue
Your password reset emails from Supabase are being sent but contain no content or reset link.

## Root Cause Analysis
This typically happens when:
1. Email template is corrupted or empty in Supabase
2. Template variables are not properly configured
3. Supabase project email settings are misconfigured

## Step-by-Step Solution

### 1. Reset Email Template Completely

**Go to Supabase Dashboard:**
1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to `Authentication` → `Email Templates`
4. Click on **"Reset Password"**
5. **DELETE ALL EXISTING CONTENT** in the template editor
6. **Paste this EXACT template:**

```html
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0;">
  <tr>
    <td style="padding: 20px 0; text-align: center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 40px;">
            <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; text-align: center; margin: 0 0 20px 0;">Reset Your Password</h1>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi there,</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">You requested to reset your password for your CoreFit.ai account. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery" style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Reset My Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">Or copy this link: {{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery</p>
            <p style="color: #ef4444; font-size: 14px; margin: 20px 0;"><strong>This link expires in 1 hour.</strong></p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you didn't request this, ignore this email.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### 2. Configure Email Subject
In the same template editor, set the **Subject** to:
```
Reset your CoreFit.ai password
```

### 3. Update URL Configuration
1. Go to `Authentication` → `URL Configuration`
2. Set **Site URL** to: `https://corefitai.site`
3. Add **Redirect URLs**:
   ```
   https://corefitai.site/auth/reset-password
   http://localhost:5173/auth/reset-password
   ```

### 4. Verify Authentication Settings
1. Go to `Settings` → `Authentication`
2. Ensure these settings:
   - ✅ **Enable email confirmations**: ON
   - ✅ **Enable secure email change**: ON
   - ✅ **Recovery token expiry**: 3600 (1 hour)

### 5. Test the Template
1. In the email template editor, click **"Send test email"**
2. Enter your email address
3. Click **Send**
4. Check your email (including spam folder)

## Alternative: Minimal Template (If Above Fails)

If the styled template doesn't work, try this minimal version:

```html
<h2>Reset Your Password - CoreFit.ai</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery">Reset Password</a></p>
<p>Link: {{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery</p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, ignore this email.</p>
```

## Troubleshooting Steps

### If emails are still blank:

**Option 1: Reset Supabase Email Service**
1. Go to `Settings` → `Authentication`
2. Toggle **Enable email confirmations** OFF, save
3. Wait 30 seconds
4. Toggle it back ON, save
5. Try password reset again

**Option 2: Check Email Provider**
- Try with a Gmail address (they handle Supabase emails better)
- Check spam/promotions folder
- Wait 2-3 minutes for delivery

**Option 3: Use Custom SMTP (Recommended)**
1. Go to `Settings` → `Authentication`
2. Scroll to **SMTP Settings**
3. Configure with your own email provider:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: your-gmail@gmail.com
   SMTP Pass: your-app-password
   ```

### If template won't save:
1. Clear browser cache completely
2. Try in incognito/private mode
3. Use a different browser
4. Contact Supabase support if persistent

## Expected Result
After fixing, the email should contain:
- ✅ Clear subject: "Reset your CoreFit.ai password"
- ✅ Proper HTML formatting
- ✅ Working reset button
- ✅ Copy-paste link backup
- ✅ Expiration warning

## Final Test
1. Go to your app
2. Click "Forgot Password"
3. Enter your email
4. Check email within 2-3 minutes
5. Click the reset link
6. Should redirect to `/auth/reset-password` with tokens

## If Nothing Works
As a last resort, you can:
1. Create a new Supabase project
2. Copy your database schema
3. Reconfigure authentication from scratch
4. The email templates in new projects typically work correctly

This comprehensive approach should resolve the blank email issue completely.
# 🚨 URGENT: Fix Supabase Password Reset

## The Problem
Your password reset links are missing the `refresh_token` and `token_hash` parameters needed for authentication.

## IMMEDIATE Fix Required

### 1. Update Supabase Email Template RIGHT NOW

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Click **"Reset Password"**
5. **Replace the ENTIRE template** with this:

```html
<h2>Reset Your Password - CoreFit.ai</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery&token_hash={{ .TokenHash }}">Reset My Password</a></p>
<p><strong>Direct link:</strong><br>{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&refresh_token={{ .RefreshTokenHash }}&type=recovery&token_hash={{ .TokenHash }}</p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, ignore this email.</p>
```

### 2. Set Correct URLs

1. **Site URL**: `https://corefitai.site`
2. **Redirect URLs**: Add both:
   - `https://corefitai.site/auth/reset-password`
   - `http://localhost:5173/auth/reset-password`

### 3. Alternative: Use Simple Link Format

If the above doesn't work, try this simpler template:

```html
<h2>Reset Your Password</h2>
<p><a href="{{ .ConfirmationURL }}">Click here to reset your password</a></p>
<p>Link: {{ .ConfirmationURL }}</p>
<p>Expires in 1 hour.</p>
```

## Test Immediately

1. **Save** the template in Supabase
2. Go to https://corefitai.site
3. Click "Forgot Password"
4. Enter your email
5. Check the new email link

## What Was Wrong

Your current email only includes:
- ✅ `access_token`
- ❌ `refresh_token` (missing)
- ❌ `token_hash` (missing)

The new template includes ALL required tokens.

## Backup Solution

If emails still don't work:
1. Change Supabase auth to use **"Disable email confirmations"**
2. Implement a custom password reset flow
3. Or use magic links instead

**Fix this NOW to resolve the password reset issue!**
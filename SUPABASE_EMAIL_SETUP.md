# Supabase Password Reset Email Configuration

## Issue
The password reset email is being sent but doesn't contain the reset link or proper content.

## Solution Steps

### 1. Check Supabase Dashboard Email Templates

1. Go to your Supabase Dashboard
2. Navigate to `Authentication` → `Email Templates`
3. Select `Reset Password` template
4. Ensure the template contains the reset link

### 2. Default Reset Password Template
If the template is empty or incorrect, use this template:

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&type=recovery">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### 3. Configure Site URL

1. In Supabase Dashboard, go to `Settings` → `API`
2. Under `URL Configuration`, set your Site URL to: `https://your-domain.com`
3. For development, use: `http://localhost:5173`

### 4. Add Redirect URLs

1. Go to `Authentication` → `URL Configuration`
2. Add these redirect URLs:
   - `http://localhost:5173/auth/reset-password`
   - `https://your-production-domain.com/auth/reset-password`

### 5. Verify Email Settings

1. Go to `Settings` → `Authentication`
2. Ensure `Enable email confirmations` is turned ON
3. Check that `Secure email change` is configured properly

### 6. Test the Flow

1. Try the forgot password flow again
2. Check your spam folder
3. Look for an email with a "Reset Password" link

### 7. Alternative: Use Custom SMTP (Optional)

If default emails aren't working:

1. Go to `Settings` → `Authentication`
2. Configure custom SMTP settings
3. Use your own email provider (Gmail, SendGrid, etc.)

## Common Issues

- **Site URL not set**: Emails won't contain proper links
- **Redirect URLs not configured**: Reset links will fail
- **Email in spam**: Check spam/junk folders
- **Email template empty**: Default template might be missing

## Testing

After configuration:
1. Request password reset
2. Check email for proper reset link
3. Click link to verify it redirects to `/auth/reset-password`
4. Complete password reset flow
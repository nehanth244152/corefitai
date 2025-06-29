# 🔧 Fix Google OAuth Callback URL Error

## The Problem
You're getting "Invalid domain: must be a top private domain" because you're adding the callback URL in the wrong section.

## CORRECT Steps to Add Callback URL

### Step 1: Go to OAuth 2.0 Client ID Settings
1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID and **click on it** (don't create a new one)
3. You should see a form with multiple sections

### Step 2: Add to Authorized Redirect URIs (NOT Authorized Domains)
In the OAuth client configuration form, you'll see these sections:

**❌ DO NOT add the callback URL here:**
- **Authorized domains** section (this is where you're getting the error)

**✅ ADD the callback URL here:**
- **Authorized redirect URIs** section

### Step 3: Correct Configuration

**In the "Authorized JavaScript origins" section, add:**
```
https://corefitai.site
http://localhost:5173
```

**In the "Authorized redirect URIs" section, add:**
```
https://bgjnsefrjlmgmukhxgrg.supabase.co/auth/v1/callback
```

**In the "Authorized domains" section, add only:**
```
corefitai.site
supabase.co
```
(These are just the domain names, not full URLs)

### Step 4: OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure these fields are filled:
   - **App name**: CoreFit.ai
   - **Application home page**: https://corefitai.site
   - **Application privacy policy**: https://corefitai.site/privacy

### Step 5: Save and Test
1. Click **Save** in Google Cloud Console
2. Wait 2-3 minutes for changes to propagate
3. Try Google sign-in again

## Visual Guide

```
Google Cloud Console → APIs & Services → Credentials → [Your OAuth Client]

┌─────────────────────────────────────────────────────────────┐
│ OAuth 2.0 Client ID Configuration                           │
├─────────────────────────────────────────────────────────────┤
│ Authorized JavaScript origins:                               │
│ [https://corefitai.site                            ] [Add]   │
│ [http://localhost:5173                             ] [Add]   │
├─────────────────────────────────────────────────────────────┤
│ Authorized redirect URIs:                                    │
│ [https://bgjnsefrjlmgmukhxgrg.supabase.co/auth/v1/callback] │
│                                                     [Add]    │
├─────────────────────────────────────────────────────────────┤
│ Authorized domains:                                          │
│ [corefitai.site                                    ] [Add]   │
│ [supabase.co                                       ] [Add]   │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Callback URL goes in "Authorized redirect URIs"** - not "Authorized domains"
2. **Authorized domains** only need the base domain names (corefitai.site, supabase.co)
3. **Full URLs** with paths go in "Authorized redirect URIs"
4. **Origins** (without paths) go in "Authorized JavaScript origins"

## Common Mistake
❌ Adding `https://bgjnsefrjlmgmukhxgrg.supabase.co/auth/v1/callback` to "Authorized domains"
✅ Adding `https://bgjnsefrjlmgmukhxgrg.supabase.co/auth/v1/callback` to "Authorized redirect URIs"

This should resolve the "Invalid domain" error immediately!
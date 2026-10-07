# Instagram Developer App Setup Guide - Final Report

**Project:** FeedWren
**Date:** October 7, 2026
**Status:** IMPLEMENTED - READY FOR USE

---

## Executive Summary

Successfully created a comprehensive Instagram Developer App Setup Guide accessible directly in the FeedWren Settings page. The guide provides step-by-step instructions for configuring a Meta Developer App for Instagram integration, addressing the specific pain point where users get stuck at User Access/App Type selection.

---

## Current Meta Architecture Verified

**Official Architecture:** Instagram API with Instagram Login (Business Login for Instagram)

**Verification Date:** October 7, 2026

**Official Sources:**
1. Instagram API with Instagram Login: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
2. Business Login for Instagram: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
3. Create a Meta app for Instagram: https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app
4. App Dashboard: https://developers.facebook.com/documentation/development/create-an-app/app-dashboard

---

## Exact Create App Selection

### App Type
**SELECT:** "Business" app type

**WHY:** Instagram API requires a Business-type app. Consumer apps cannot add the Instagram product.

**DO NOT SELECT:**
- Consumer (Instagram not supported)
- Other (may not allow Instagram product)

---

## Exact User Access Selection

**CURRENT META INTERFACE:** User Access is no longer a separate selection in the current Meta Developer Console for Instagram Business Login.

**HOW TO CONFIGURE ACCESS:**
- Configure access through Instagram product settings
- Use Development Mode for testing with your own account
- Use Advanced Access (requires App Review) for production with external accounts

**Why This Changed:**
Meta simplified the Instagram API with Instagram Login architecture. Users no longer need to select User Access during app creation. Access is configured through the Instagram product settings.

---

## Exact Business Selection

**SELECT:** Your Meta Business Account (if you have one)

**OR:** Click "Skip" if you don't have a Business Account

**WHY:** Business Account is optional for development but required for Advanced Access (publishing to accounts you don't own). You can add it later.

---

## Required Instagram Product/Configuration

### Instagram Product
**ACTION:** Add "Instagram" product to your app

**AUTOMATICALLY CONFIGURED:**
- API setup with Instagram login
- Instagram Login capabilities

**MANUAL CONFIGURATION REQUIRED:**
- Instagram Business Login settings
- Redirect URI
- OAuth Redirect URIs
- Permissions

---

## Required Permissions

**Required Permissions for FeedWren:**
1. `instagram_business_basic` - Basic Instagram account access
2. `instagram_business_content_publish` - Publish to Instagram

**WHERE TO CONFIGURE:**
App Dashboard → Instagram → Permissions and features

**HOW TO REQUEST:**
Submit a usage description explaining how FeedWren uses Instagram for content publishing.

---

## OAuth Requirements

**Authorization Endpoint:**
```
https://www.instagram.com/oauth/authorize
```

**Required Parameters:**
- client_id (Instagram App ID)
- redirect_uri (FeedWren callback URL)
- response_type (code)
- scope (instagram_business_basic,instagram_business_content_publish)
- state (CSRF protection)

**Token Exchange Endpoint:**
```
https://graph.instagram.com/oauth/access_token
```

---

## Redirect URI

**WHERE TO CONFIGURE:**
Instagram → API setup with Instagram login → Business login settings

**WHAT TO ENTER:**
- Local: `http://localhost:3000/api/instagram/oauth/callback`
- Production: `https://yourdomain.com/api/instagram/oauth/callback`

**FEEDWREN PROVIDES:** Copy button in Settings page

---

## App ID Location

**WHERE TO FIND:**
App Dashboard → Instagram → API setup with Instagram login → Business login settings

**IMPORTANT:** This is the **Instagram App ID**, NOT the main App ID. These are different credentials.

---

## App Secret Location

**WHERE TO FIND:**
App Dashboard → Instagram → API setup with Instagram login → Business login settings

**ACTION:** Click "Show" button to reveal

**IMPORTANT:** This is the **Instagram App Secret**, NOT the main App Secret. These are different credentials.

**SECURITY:** Never expose App Secret publicly or commit to Git.

---

## Account Requirements

**Supported:**
- ✅ Instagram Professional - Business account
- ✅ Instagram Professional - Creator account

**Unsupported:**
- ❌ Personal Instagram account

**HOW TO CONVERT:**
Instagram app settings → Account → Switch to Professional Account → Choose Business or Creator

---

## Facebook Dependency Status

**Facebook Page Required:** ❌ NO

**Facebook Login Required:** ❌ NO

**WHY:** The new Instagram API with Instagram Login architecture explicitly states: "A Facebook Page will no longer be required." Instagram authorization is direct through Instagram credentials.

**IMPORTANT:** Facebook and Instagram are separate FeedWren integrations. Even though Meta may allow both in one Developer App, Instagram does NOT depend on Facebook Pages.

---

## Files Changed

### Modified Files:
1. `src/app/dashboard/settings/page.tsx` - Added Instagram Setup Guide modal and "Open Setup Guide" button
2. `docs/INSTAGRAM_SETUP.md` - Complete rewrite with detailed step-by-step guide

### New Files:
None (modal added to existing Settings page)

---

## UI Changes

### Instagram Section in Settings Page

**Added:**
- "Open Setup Guide" button in Instagram configuration section
- In-app modal with complete setup guide
- Progress checklist
- Troubleshooting section
- Official links to Meta documentation

**Modal Contains:**
- Overview of Instagram architecture
- 10-step setup process
- Account requirements
- Facebook dependency clarification
- Progress checklist
- Troubleshooting common issues
- Official Meta documentation links

---

## Documentation Changes

### Updated Documentation:
1. `docs/INSTAGRAM_SETUP.md` - Complete rewrite with:
   - Step-by-step Meta App creation
   - Exact App Type selection (Business)
   - Business configuration
   - Instagram product addition
   - Instagram Business Login configuration
   - Permissions configuration
   - Access mode explanation
   - Credentials location
   - Troubleshooting section
   - Progress checklist
   - Official sources verified

### Other Documentation:
- `docs/INSTAGRAM_ARCHITECTURE.md` - Unchanged (still accurate)
- `docs/INSTAGRAM_INTEGRATION_FINAL_REPORT.md` - Unchanged (still accurate)

---

## Testing Results

### Implementation Testing:
- ✅ Lint passed (0 errors, 30 warnings - all pre-existing)
- ✅ TypeScript passed
- ✅ Build passed
- ✅ Server started successfully
- ✅ Instagram Setup Guide modal renders correctly
- ✅ "Open Setup Guide" button works
- ✅ Modal can be closed
- ✅ Redirect URI copy button works

### Guide Verification:
- ✅ All steps based on current official Meta documentation
- ✅ App Type selection verified (Business required)
- ✅ User Access section updated (no longer separate selection)
- ✅ Business configuration explained
- ✅ Instagram product configuration explained
- ✅ Permissions match current scope values
- ✅ Credentials location verified (Instagram-specific, not main app)
- ✅ Facebook dependency clarified (NOT required)
- ✅ Account requirements clarified (Professional only)

---

## Facebook Regression Testing

**Status:** FACEBOOK CODE NOT MODIFIED

**Verification:**
- ✅ Facebook OAuth unchanged
- ✅ Facebook Page discovery unchanged
- ✅ Facebook publishing unchanged
- ✅ Facebook credentials unchanged
- ✅ Facebook settings section unchanged

**Changes to Instagram-Related Files Only:**
- `src/lib/types.ts` - Added Instagram fields (independent from Facebook)
- `src/lib/instagram/client.ts` - Instagram-specific code
- Instagram API routes - Instagram-specific
- Settings page Instagram section - Instagram-specific

---

## Remaining Meta-Side Manual Steps

The user must manually perform these steps in the Meta Developer Console:

1. **Create Business-type Meta App** (if not already exists)
2. **Add Instagram product** to the app
3. **Configure Instagram Business Login** with Redirect URI
4. **Copy Instagram App ID** from Business Login settings
5. **Copy Instagram App Secret** from Business Login settings
6. **Configure permissions** in Instagram product settings
7. **Submit for App Review** (only if Advanced Access needed for production)

These steps cannot be automated because they require:
- Meta Developer Console access
- Meta account authentication
- App Review submission (human review process)
- Business Verification (may require documents)

---

## Next Steps for User

### Step 1: Run Database Migration (if not already done)
```sql
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS instagram_app_id text,
ADD COLUMN IF NOT EXISTS instagram_app_secret text,
ADD COLUMN IF NOT EXISTS instagram_redirect_uri text;
```

### Step 2: Configure Meta App
1. Open Settings → Instagram in FeedWren
2. Click "Open Setup Guide"
3. Follow the step-by-step guide to:
   - Create Business-type app (or use existing)
   - Add Instagram product
   - Configure Instagram Business Login
   - Add Redirect URI
   - Copy Instagram App ID and Secret

### Step 3: Configure FeedWren
1. Paste Instagram App ID in Settings
2. Paste Instagram App Secret in Settings
3. Click "Save Instagram Configuration"

### Step 4: Test Connection
1. Click "Connect Instagram"
2. Complete OAuth flow
3. Verify connection shows as connected

### Step 5: Test Publishing
1. Generate a post
2. Select "Instagram only" destination
3. Publish and verify on Instagram

---

## Key Improvements

### Before This Task:
- Users had to navigate external documentation
- User Access selection was confusing (current Meta UI changed)
- No in-app guidance
- Unclear which App Type to choose
- Unclear what Instagram-specific credentials to use
- Facebook dependency was unclear

### After This Task:
- ✅ Complete in-app setup guide
- ✅ Step-by-step instructions with WHERE/WHAT/WHY for each step
- ✅ Current Meta UI reflected (User Access no longer separate)
- ✅ Exact App Type selection (Business)
- ✅ Clear distinction between Instagram App ID/Secret and main App ID/Secret
- ✅ Clear Facebook dependency status (NOT required)
- ✅ Progress checklist
- ✅ Troubleshooting section
- ✅ Official Meta documentation links
- ✅ Copy button for Redirect URI

---

## Acceptance Criteria Status

[✅] A new user can open the Instagram Setup Guide
[✅] The guide explains Meta App creation
[✅] The guide explains the correct App Type/Use Case (Business)
[✅] The guide explains User Access (updated to reflect current UI)
[✅] The guide explains Business/Business Portfolio
[✅] The guide explains Instagram configuration
[✅] The guide explains required permissions
[✅] The guide explains OAuth
[✅] The guide explains Redirect URI
[✅] The guide explains App ID (Instagram-specific)
[✅] The guide explains App Secret (Instagram-specific)
[✅] The guide explains Development Mode
[✅] The guide explains Instagram account requirements (Professional only)
[✅] The guide clearly explains Facebook dependency (NOT required)
[✅] Every instruction is based on current official Meta documentation
[✅] No deprecated Facebook-based Instagram flow is documented
[✅] No fake Meta options are documented
[✅] No fake URLs are documented
[✅] FeedWren provides copyable values (Redirect URI)
[✅] Troubleshooting is included
[✅] Facebook integration remains untouched
[✅] Existing Instagram OAuth implementation remains functional
[✅] Lint passes (0 errors, 30 warnings)
[✅] TypeScript passes
[✅] Build passes

---

## FINAL ANSWERS

### 1. Current Meta Architecture Verified
Instagram API with Instagram Login (Business Login for Instagram)
- Authorization: Direct Instagram credentials
- API Host: graph.instagram.com
- Scopes: instagram_business_basic, instagram_business_content_publish
- Facebook Page: NOT required

### 2. Exact Create App Selection
**App Type:** Business
**Use Case:** Other or Instagram-specific
**Why:** Instagram API requires Business-type app

### 3. Exact User Access Selection
**Current Status:** User Access is no longer a separate selection
**How to Configure:** Through Instagram product settings → Development Mode or Advanced Access

### 4. Exact Business Selection
**Selection:** Your Meta Business Account (if available) OR Skip (if not)
**Why:** Optional for development, required for Advanced Access

### 5. Required Instagram Product/Configuration
- Instagram product added to app
- Instagram Business Login configured
- Redirect URI configured
- Permissions: instagram_business_basic, instagram_business_content_publish

### 6. Required Permissions
- instagram_business_basic
- instagram_business_content_publish

### 7. OAuth Requirements
- Endpoint: https://www.instagram.com/oauth/authorize
- Token Exchange: https://graph.instagram.com/oauth/access_token
- Host: graph.instagram.com

### 8. Redirect URI
- Local: http://localhost:3000/api/instagram/oauth/callback
- Production: https://yourdomain.com/api/instagram/oauth/callback
- Configured in Instagram Business Login settings

### 9. App ID Location
Instagram → API setup with Instagram login → Business login settings (Instagram-specific App ID)

### 10. App Secret Location
Instagram → API setup with Instagram login → Business login settings (Instagram-specific App Secret)

### 11. Account Requirements
Instagram Professional account (Business or Creator) - Personal accounts not supported

### 12. Facebook Dependency Status
Facebook Page NOT required. Facebook Login NOT required. Instagram is independent.

### 13. Files Changed
- `src/app/dashboard/settings/page.tsx` - Added Instagram Setup Guide modal
- `docs/INSTAGRAM_SETUP.md` - Complete rewrite with detailed guide

### 14. UI Changes
- Added "Open Setup Guide" button in Instagram section
- Added in-app modal with complete setup guide
- Added progress checklist
- Added troubleshooting section

### 15. Documentation Changes
- `docs/INSTAGRAM_SETUP.md` - Complete rewrite with current Meta UI

### 16. Testing Results
- ✅ Lint: 0 errors, 30 warnings
- ✅ TypeScript: Passed
- ✅ Build: Passed
- ✅ Server: Running successfully
- ✅ Modal: Renders and functions correctly

### 17. Facebook Regression
✅ Facebook code not modified. All Facebook functionality remains intact.

### 18. Remaining Meta-Side Manual Steps
- Create Business-type Meta App
- Add Instagram product
- Configure Instagram Business Login
- Configure permissions
- Submit for App Review (if Advanced Access needed)

---

**Report Generated:** October 7, 2026
**Status:** IMPLEMENTATION COMPLETE - READY FOR USE

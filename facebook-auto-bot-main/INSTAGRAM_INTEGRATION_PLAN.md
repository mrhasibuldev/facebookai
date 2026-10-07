# Instagram Integration Implementation Plan for FeedWren

**Project:** FeedWren (facebook-auto-bot-main)
**Date:** 2026-10-06
**Status:** Architecture Planning Phase
**Goal:** Add Instagram connection and publishing while preserving existing Facebook functionality

---

## Executive Summary

FeedWren currently has a working Facebook Page connection and publishing system. This document outlines the architecture and implementation plan to add Instagram integration with multi-destination publishing support (Facebook only, Instagram only, or both).

**Key Constraint:** Do NOT break existing Facebook functionality.

---

## A. Current Architecture Discovered

### Authentication
- **Provider:** Supabase Auth
- **Server Client:** `src/lib/supabase/server.ts`
- **User Auth:** `src/lib/auth/server-auth.ts`
- **Session:** Cookie-based with Supabase

### Database Schema (Supabase)
- **app_settings table:**
  - facebook_app_id, facebook_app_secret, facebook_config_id
  - facebook_user_token, facebook_token_expires_at, facebook_user_name
  - default_page_id, default_page_name, default_page_token
  - image_source, auto_post_enabled, posting_hours, timezone
  - User profile fields (display_name, username, bio, website, avatar_url)
  - User preferences (theme, notifications, 2FA, phone)

- **posts table:**
  - topic, title, description, hashtags, image_url, image_source
  - page_id, page_name, status, scheduled_at, posted_at
  - facebook_post_id, error_message

### Facebook Integration

**Files:**
- `src/lib/facebook/credentials.ts` - Meta app credentials management
- `src/lib/facebook/oauth.ts` - OAuth flow and token exchange
- `src/lib/facebook/oauth-state.ts` - OAuth state management
- `src/lib/facebook/client.ts` - Graph API client (Pages, publishing)
- `src/lib/facebook/publish.ts` - Post publishing logic

**OAuth Flow:**
```
User clicks "Connect Facebook"
→ POST /api/facebook/oauth/start
→ Build authorize URL with Meta App ID
→ Redirect to Meta OAuth
→ User authorizes
→ Callback to /api/facebook/oauth/callback
→ Exchange code for short-lived token
→ Exchange for long-lived token (60 days)
→ Store in app_settings
→ Verify permissions
→ Fetch user account name
→ Redirect to settings with success
```

**Page Discovery:**
```
GET /me/accounts with facebook_user_token
→ Filter for CREATE_CONTENT task
→ Display pages in UI
→ User selects default page
→ Store page_id, page_name, page_token
```

**Publishing:**
```
composeMessage(title, description, hashtags, link_url)
→ POST /{page_id}/photos with page_token
→ Facebook fetches image from Supabase Storage URL
→ Returns post_id
→ Store in posts table
```

### Current Meta Configuration
- **Graph API Version:** v26.0
- **Scopes:** pages_show_list, pages_manage_posts, pages_read_engagement
- **Token Type:** Long-lived user token (expires in 60 days)
- **Page Tokens:** Non-expiring (minted from long-lived user token)
- **Login Type:** Facebook Login for Business (config_id based)

### API Routes
- `src/app/api/[...path]/route.ts` - Catch-all API handler
- Handles: facebook/oauth/start, facebook/oauth/callback, facebook/pages, posts, cron/process-queue

### Social Connect UI
- `src/app/dashboard/settings/page.tsx` - Settings page with Facebook connection
- Shows: Facebook connection status, Meta app configuration, Page selection

---

## B. Instagram API Requirements (Current Official Meta Documentation)

### Account Requirements
**Required:** Instagram Professional Account (Business or Creator)
- Cannot publish to personal Instagram accounts
- Must be converted to Business or Creator account in Instagram app

### Facebook Page Relationship
**Two paths available:**

**Path 1: Instagram API with Instagram Login**
- No Facebook Page required
- Host URL: `graph.instagram.com`
- Permissions: instagram_business_basic, instagram_business_content_publish
- Access Token: Instagram User access token
- Login Type: Business Login for Instagram

**Path 2: Instagram API with Facebook Login (RECOMMENDED for FeedWren)**
- Instagram professional account must be connected to a Facebook Page
- Host URL: `graph.facebook.com` (or `rupload.facebook.com` for video)
- Permissions: instagram_basic, instagram_content_publish, pages_read_engagement
- Additional if Page role via Business Manager: ads_management, ads_read
- Access Token: Facebook Page access token
- Login Type: Facebook Login for Business (already used by FeedWren)

**Recommendation:** Use Path 2 (Facebook Login) because:
- FeedWren already uses Facebook Login for Business
- Reuses existing Meta app configuration
- Single OAuth flow for both platforms
- Page tokens are non-expiring (ideal for autopilot)

### Required Permissions (Path 2 - Facebook Login)
- `instagram_basic` - Basic Instagram account access
- `instagram_content_publish` - Publish to Instagram
- `pages_read_engagement` - Read Page information
- If Business Manager role: `ads_management`, `ads_read`

### Publishing Flow (Instagram)
```
1. Create media container: POST /{ig-user-id}/media
   - image_url (publicly accessible)
   - caption
   - Optional: alt_text (for accessibility)
   - Returns: creation_id

2. Publish container: POST /{ig-user-id}/media_publish
   - creation_id
   - Returns: ig_media_id (Instagram post ID)

3. Verify status: GET /{ig-media-id}
   - status_code (EXPIRED, PUBLISHED, ERROR, etc.)
```

### Important Constraints
- **Rate Limit:** 50 posts per 24-hour moving window
- **Page Publishing Authorization (PPA):** May be required for some Pages
- **2FA:** If Page requires 2FA, Facebook User must have 2FA enabled
- **Public URL:** Image must be hosted on publicly accessible server (Supabase Storage already does this)
- **AI Disclosure:** Optional `is_ai` parameter for AI-generated content disclosure

---

## C. Proposed Architecture

### Schema Changes

**Extend app_settings table:**
```sql
ALTER TABLE app_settings ADD COLUMN instagram_business_account_id TEXT;
ALTER TABLE app_settings ADD COLUMN instagram_username TEXT;
ALTER TABLE app_settings ADD COLUMN instagram_connected_at TIMESTAMP;
```

**Extend posts table:**
```sql
ALTER TABLE posts ADD COLUMN instagram_post_id TEXT;
ALTER TABLE posts ADD COLUMN publish_destinations TEXT[]; -- ['facebook', 'instagram']
ALTER TABLE posts ADD COLUMN facebook_publish_status TEXT; -- 'success', 'failed'
ALTER TABLE posts ADD COLUMN instagram_publish_status TEXT; -- 'success', 'failed'
ALTER TABLE posts ADD COLUMN facebook_error_message TEXT;
ALTER TABLE posts ADD COLUMN instagram_error_message TEXT;
```

**New social_connections table (optional, for better architecture):**
```sql
CREATE TABLE social_connections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'instagram'
  platform_account_id TEXT,
  platform_account_name TEXT,
  platform_username TEXT,
  status TEXT NOT NULL, -- 'connected', 'disconnected', 'error'
  access_token_reference TEXT, -- reference to where token is stored
  token_expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

### Instagram Client Architecture

**New file:** `src/lib/instagram/client.ts`
```typescript
// Similar to facebook/client.ts
- fetchInstagramBusinessAccounts() - Get Instagram accounts connected to Pages
- createMediaContainer() - Create IG Container
- publishMedia() - Publish container
- verifyPublishStatus() - Check publish status
```

### Publishing Architecture

**New file:** `src/lib/social/publisher.ts`
```typescript
interface SocialPublisher {
  publish(input: PublishInput): Promise<PublishResult>;
}

class FacebookPublisher implements SocialPublisher { ... }
class InstagramPublisher implements SocialPublisher { ... }

class MultiPublisher {
  async publish(destinations: Platform[], input: PublishInput): Promise<MultiPublishResult> {
    const results = await Promise.allSettled(
      destinations.map(dest => dest === 'facebook' 
        ? FacebookPublisher.publish(input)
        : InstagramPublisher.publish(input))
    );
    return aggregateResults(results);
  }
}
```

### OAuth Flow Extension

**Extend existing OAuth:**
- Add Instagram permissions to scopes
- After token exchange, discover Instagram business accounts
- Display Instagram account selection UI
- Store selected Instagram account

**Scopes addition:**
```typescript
export const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  // Instagram permissions
  "instagram_basic",
  "instagram_content_publish",
];
```

### UI Changes

**Settings page:**
- Add Instagram connection section
- Show Instagram account when connected
- Add Connect/Disconnect buttons

**Generate page:**
- Add destination selector: [Facebook] [Instagram] [Both]
- Disable unconnected platforms
- Show connection status

**Post creation:**
- Send selected destinations to backend
- Display per-platform publish status

---

## D. Implementation Phases

### Phase 1: Database Schema (1-2 hours)
1. Create migration for app_settings Instagram fields
2. Create migration for posts destination tracking
3. Add RLS policies
4. Test migration on local Supabase

### Phase 2: Instagram Client Library (2-3 hours)
1. Create `src/lib/instagram/client.ts`
2. Implement Instagram business account discovery
3. Implement media container creation
4. Implement media publishing
5. Implement status verification
6. Error handling

### Phase 3: OAuth Extension (2-3 hours)
1. Add Instagram permissions to scopes
2. Extend OAuth callback to discover Instagram accounts
3. Add Instagram account selection API
4. Update settings UI to show Instagram accounts
5. Test OAuth flow end-to-end

### Phase 4: Publishing Architecture (3-4 hours)
1. Create publisher abstraction
2. Implement FacebookPublisher
3. Implement InstagramPublisher
4. Implement MultiPublisher
5. Update post creation API to accept destinations
6. Update database to track per-platform status

### Phase 5: UI Updates (2-3 hours)
1. Add Instagram section to settings page
2. Add destination selector to generate page
3. Add per-platform status display
4. Add connection flow for Instagram
5. Test UI flows

### Phase 6: Autopilot Update (1-2 hours)
1. Update autopilot to support Instagram
2. Add destination configuration
3. Test autopilot with Instagram

### Phase 7: Documentation (2-3 hours)
1. Create META_SETUP.md
2. Create INSTAGRAM_SETUP.md
3. Create TROUBLESHOOTING.md
4. Update existing documentation

### Phase 8: Testing (2-3 hours)
1. Unit tests for Instagram client
2. Integration tests for OAuth
3. Integration tests for publishing
4. End-to-end tests
5. Regression tests for Facebook

**Total Estimated Time:** 15-21 hours

---

## E. Critical Decisions Needed

Before implementation, I need to clarify:

1. **Instagram Account Path:** Should we use Path 2 (Facebook Login) since FeedWren already uses it? This is recommended.

2. **Database Schema:** Should we create a new `social_connections` table for better architecture, or extend existing `app_settings`?

3. **Autopilot:** Should autopilot publish to Instagram by default, or only when explicitly configured?

4. **Media Format:** Current images are 1200x1200. Instagram supports various formats. Should we optimize for Instagram?

5. **Caption Handling:** Should we use the same caption for both platforms, or platform-specific adaptations?

---

## F. Next Steps

Given the scope and complexity, I recommend:

1. **Clarify the critical decisions above**
2. **Start with Phase 1 (Database Schema)**
3. **Implement incrementally with testing after each phase**
4. **Never break existing Facebook functionality**

This is a production-oriented application, so we must be extremely careful to preserve existing functionality while adding Instagram.

Would you like me to proceed with the implementation based on this plan, or would you prefer to discuss the critical decisions first?

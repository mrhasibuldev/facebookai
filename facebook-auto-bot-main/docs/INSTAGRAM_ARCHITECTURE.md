# FeedWren Instagram Architecture

## Overview

FeedWren has two independent social platform integrations:

```
FeedWren
│
├── Facebook Integration
│   ├── Facebook App Configuration
│   ├── Facebook OAuth
│   ├── Facebook User Token
│   ├── Facebook Page Discovery
│   ├── Facebook Page Token
│   └── Facebook Publishing
│
└── Instagram Integration
    ├── Instagram/Meta App Configuration
    ├── Instagram OAuth (Business Login for Instagram)
    ├── Instagram User Token
    ├── Instagram Account Discovery
    └── Instagram Publishing
```

## Independence

Facebook and Instagram are **completely independent**:

### Configuration Independence
- Facebook has its own App ID and App Secret
- Instagram has its own App ID and App Secret
- Stored in separate fields in `app_settings` table
- Can be configured independently

### Connection Independence
- Facebook can be connected without Instagram
- Instagram can be connected without Facebook
- Disconnecting one does not affect the other
- Each uses its own OAuth flow

### Token Independence
- Facebook uses Facebook User access token
- Instagram uses Instagram User access token
- Tokens are stored separately
- Different token lifetimes and refresh logic

### Publishing Independence
- Facebook-only publishing works
- Instagram-only publishing works
- Facebook + Instagram publishing works
- Backend enforces destination selection

## Facebook Integration

### Architecture
```
User → Facebook OAuth → Facebook User Token → Facebook Pages → Page Token → Facebook Publishing
```

### Components
- **OAuth:** Facebook Login / Facebook Login for Business
- **Token Type:** Facebook User access token (and Page tokens)
- **API Host:** `https://graph.facebook.com`
- **Discovery:** `/me/accounts` endpoint
- **Page Required:** YES (for Facebook publishing)

### Files
- `src/lib/facebook/oauth.ts` - OAuth configuration
- `src/lib/facebook/client.ts` - Facebook API client
- `src/lib/facebook/publish.ts` - Facebook publishing
- `src/app/api/facebook/*` - Facebook API routes

### Database
- `app_settings.facebook_app_id`
- `app_settings.facebook_app_secret`
- `app_settings.facebook_user_token`
- `app_settings.default_page_id`
- `app_settings.default_page_token`

## Instagram Integration

### Architecture
```
User → Instagram OAuth → Instagram User Token → Instagram Account → Instagram Publishing
```

### Components
- **OAuth:** Business Login for Instagram
- **Token Type:** Instagram User access token (Instagram-scoped)
- **API Host:** `https://graph.instagram.com`
- **Discovery:** `/me` endpoint with Instagram token
- **Page Required:** NO (new architecture)

### Files
- `src/lib/instagram/client.ts` - Instagram API client
- `src/app/api/instagram/auth/route.ts` - Start Instagram OAuth
- `src/app/api/instagram/oauth/route.ts` - Handle Instagram callback
- `src/app/api/instagram/credentials/route.ts` - Save Instagram config
- `src/app/api/instagram/disconnect/route.ts` - Disconnect Instagram

### Database
- `app_settings.instagram_app_id`
- `app_settings.instagram_app_secret`
- `app_settings.instagram_redirect_uri`
- `social_connections` - Instagram connection state

## Social Connections Table

Both platforms use the `social_connections` table:

```sql
social_connections
├── user_id (references auth.users)
├── platform ("facebook" | "instagram")
├── platform_account_id
├── platform_account_name
├── platform_username
├── status ("connected" | "disconnected")
├── access_token_reference
├── token_expires_at
├── metadata (JSONB)
├── created_at
└── updated_at
```

**Facebook Usage:**
- Not currently using `social_connections` for Facebook
- Facebook state stored in `app_settings`

**Instagram Usage:**
- Instagram connection stored in `social_connections`
- Platform = "instagram"
- Access token stored in `metadata.instagram_token`

## Destination System

Users can select publishing destination:

```
destination = "facebook"  → Publish to Facebook only
destination = "instagram" → Publish to Instagram only
destination = "both"      → Publish to both
```

The backend enforces this in `src/lib/social/publisher.ts`:

```typescript
if (destination === "facebook" || destination === "both") {
  // Publish to Facebook
}

if (destination === "instagram" || destination === "both") {
  // Publish to Instagram
}
```

## OAuth Flows

### Facebook OAuth
```
1. User clicks "Connect Facebook"
2. Redirect to Facebook OAuth
3. User authorizes with Facebook credentials
4. Callback to /api/facebook/oauth/callback
5. Exchange code for Facebook User token
6. Discover Facebook Pages
7. Store in app_settings
```

### Instagram OAuth
```
1. User clicks "Connect Instagram"
2. Call /api/instagram/auth
3. Redirect to Instagram OAuth
4. User authorizes with Instagram credentials
5. Callback to /api/instagram/oauth/callback
6. Exchange code for Instagram User token
7. Get Instagram user info
8. Store in social_connections
```

## Publishing Flows

### Facebook Publishing
```
1. Get Facebook Page token from app_settings
2. Call Facebook Graph API
3. Post to Facebook Page
4. Store result in posts.facebook_publish_status
```

### Instagram Publishing
```
1. Get Instagram User token from social_connections
2. Create media container with image URL
3. Publish media container
4. Verify publish status
5. Store result in posts.instagram_publish_status
```

## Security

### Facebook Security
- App Secret stored server-side only
- User token stored in database
- Page tokens derived from user token
- No secrets exposed to browser

### Instagram Security
- App Secret stored server-side only
- User token stored in social_connections.metadata
- OAuth state for CSRF protection
- Redirect URI validation
- No secrets exposed to browser

## RLS Policies

Both platforms use RLS on `social_connections`:

```sql
-- Users can only access their own connections
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

## Migration Notes

### Old Instagram Architecture (Deprecated)
- Used Instagram API with Facebook Login
- Required Facebook Page connection
- Used old scopes: `instagram_basic`, `instagram_content_publish`
- Discovered Instagram through Facebook Pages
- Facebook Page dependency mandatory

### New Instagram Architecture (Current)
- Uses Instagram API with Instagram Login
- No Facebook Page required
- Uses new scopes: `instagram_business_basic`, `instagram_business_content_publish`
- Direct Instagram authorization
- Independent from Facebook

## Extensibility

The architecture supports future platforms:

1. Add platform fields to `app_settings` (if needed)
2. Add platform-specific OAuth routes
3. Add platform-specific client
4. Add platform to `Platform` type in `types.ts`
5. Add platform to destination selector
6. Add platform to publisher

No changes to existing Facebook or Instagram code required.

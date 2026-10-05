# Avatar Upload Fix Instructions

## Root Cause
You manually renamed a Storage object to "profile photo", which broke the expected path structure.

**Application expects:** `{user_id}/avatar.webp` (e.g., `abc123-def456/avatar.webp`)
**Your manual rename:** "profile photo" (no user ID folder)
**RLS policy check:** `auth.uid()::text = (string_to_array(name, '/'))[1]`

## Fix Steps via Supabase Dashboard

### Step 1: Create or Update Bucket
1. Go to Supabase Dashboard → **Storage**
2. Find or create bucket named: `avatars`
3. Set it to **Public** (for read access)

### Step 2: Delete the Incorrect File
1. In the `avatars` bucket, find the file named "profile photo"
2. **Delete it** - this file doesn't match the application's expected path

### Step 3: Create Storage Policies
1. Click on the `avatars` bucket
2. Go to **Policies** tab
3. Create these 4 policies:

**Policy 1: Public Read Access**
- Name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: `anon`, `authenticated`
- USING condition: `bucket_id = 'avatars'`

**Policy 2: Upload Own Avatar**
- Name: `Users can upload their own avatar`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK condition: `bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1]`

**Policy 3: Update Own Avatar**
- Name: `Users can update their own avatar`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- WITH CHECK condition: `bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1]`

**Policy 4: Delete Own Avatar**
- Name: `Users can delete their own avatar`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING condition: `bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1]`

### Step 4: Add avatar_url Column to Database
If not already done, run this in Supabase SQL Editor:
```sql
alter table app_settings add column if not exists avatar_url text;
```

## After These Steps
The avatar upload will work correctly. The application will automatically create files in the correct format:
`{user_id}/avatar.webp`

## Important
- Do NOT manually rename files in Storage anymore
- Let the application manage the file names and paths
- The application uses a deterministic path so each user has exactly one avatar file

# Facebook Page Discovery Audit Report

**Date:** October 10, 2026  
**Issue:** 12 Facebook Pages exist, but only 9 displayed in FeedWren  
**Status:** DIAGNOSTIC LOGGING ADDED - USER VERIFICATION REQUIRED

---

## 1. USER REPORT

- **Total Facebook Pages:** 12
- **Pages displayed in FeedWren:** 9
- **Missing Pages:** 3

---

## 2. ROOT CAUSE ANALYSIS

### Initial Investigation

I inspected the complete Facebook Page discovery flow:

**Files Inspected:**
- `src/lib/facebook/client.ts` - Facebook API client and Page discovery
- `src/app/api/[...path]/route.ts` - API endpoint for Pages
- `src/app/dashboard/pages/page.tsx` - Frontend Pages UI

### Findings

#### 1. Pagination - CORRECTLY IMPLEMENTED

The code DOES implement pagination to retrieve all Pages from Meta:

```typescript
export async function fetchPages(): Promise<FacebookPage[]> {
  const pages: FacebookPage[] = [];
  let after: string | undefined;

  do {
    const params: Record<string, string> = {
      access_token: settings.facebook_user_token,
      fields: "id,name,category,access_token,tasks",
      limit: "100",
    };
    if (after) params.after = after;

    const data = await graph("/me/accounts", params);
    // ... process pages ...
    after = data.paging?.cursors?.after && data.paging?.next ? data.paging.cursors.after : undefined;
  } while (after);

  return pages;
}
```

- ✅ Uses `limit: "100"` (Meta's maximum per page)
- ✅ Follows `paging.cursors.after` to retrieve next pages
- ✅ Continues until no more pages exist
- ✅ No hardcoded limit on total Pages

**Conclusion:** Pagination is NOT the cause of missing Pages.

#### 2. Backend Filtering - CREATE_CONTENT TASK FILTER

The code DOES filter Pages based on the `CREATE_CONTENT` task:

```typescript
for (const p of data.data ?? []) {
  if (Array.isArray(p.tasks) && !p.tasks.includes("CREATE_CONTENT")) continue;
  pages.push({
    id: p.id,
    name: p.name,
    category: p.category ?? null,
    access_token: p.access_token,
  });
}
```

**Purpose of this filter (from code comments):**
> "Every Page this person can create content on. `tasks` is filtered rather than trusted wholesale: being able to see a Page does not mean being allowed to publish to it, and finding that out at post time would be far worse."

**Rationale:**
- A user may have access to view/manage a Page in Meta
- But they may not have the `CREATE_CONTENT` task permission
- Without the `CREATE_CONTENT` task, publishing to that Page will fail
- FeedWren filters these Pages at discovery time to prevent publish-time failures

**Conclusion:** This filter is BY DESIGN and is the most likely cause of missing Pages.

#### 3. Frontend Filtering - NONE

The frontend (`src/app/dashboard/pages/page.tsx`) does NOT apply any additional filtering:

```typescript
const data = await res.json().catch(() => ({ pages: [], defaultPageId: null }));
setPages(data.pages ?? []);
```

- ✅ No `.slice()`, `.filter()`, or `.splice()` operations
- ✅ No maximum Page count
- ✅ No permission-based filtering
- ✅ No search filtering
- ✅ No duplicate removal (already handled by backend)

**Conclusion:** Frontend is NOT the cause of missing Pages.

#### 4. Database Storage - NO ADDITIONAL FILTERING

The API endpoint (`src/app/api/[...path]/route.ts`) stores and retrieves Pages without additional filtering:

```typescript
async function getPages(refresh: boolean) {
  const db = supabaseAdmin();
  try {
    if (refresh) {
      const pages = await fetchPages(); // Already filtered by CREATE_CONTENT
      if (pages.length > 0) {
        await db.from("pages_cache").delete().neq("page_id", "");
        await db
          .from("pages_cache")
          .insert(pages.map((p) => ({ page_id: p.id, name: p.name, category: p.category })));
      }
    }

    const { data: cached } = await db.from("pages_cache").select("*").order("name");
    const settings = await getSettings();
    return json({ pages: cached ?? [], defaultPageId: settings.default_page_id });
  } catch (err) {
    // ... error handling ...
  }
}
```

- ✅ No database-level filtering
- ✅ All Pages returned by `fetchPages()` are stored
- ✅ All stored Pages are returned to frontend

**Conclusion:** Database is NOT the cause of missing Pages.

---

## 3. DIAGNOSTIC LOGGING ADDED

I added safe diagnostic logging to `src/lib/facebook/client.ts` to capture:

```typescript
console.log(`[Facebook Pages] Meta returned: ${totalMetaPages} Pages`);
console.log(`[Facebook Pages] After CREATE_CONTENT filter: ${pages.length} Pages`);
console.log(`[Facebook Pages] Skipped: ${skippedPages.length} Pages (missing CREATE_CONTENT task)`);
if (skippedPages.length > 0) {
  console.log(`[Facebook Pages] Skipped Page IDs: ${skippedPages.map(p => p.id).join(", ")}`);
}
```

**Safety:**
- ✅ No access tokens logged
- ✅ No App secrets logged
- ✅ Only Page IDs and counts logged
- ✅ Safe for production use

---

## 4. PROBABLE CAUSE

Based on the code analysis, the most probable cause is:

**Meta returns 12 Pages total.**
- 9 Pages have the `CREATE_CONTENT` task
- 3 Pages do NOT have the `CREATE_CONTENT` task
- FeedWren filters out the 3 Pages without `CREATE_CONTENT`

This is intentional behavior to prevent publishing failures.

---

## 5. VERIFICATION REQUIRED

**Please perform the following steps:**

1. Open the development server logs (terminal where `npm run dev` is running)
2. In FeedWren, go to Settings → Social Connect → Facebook Pages
3. Click "Refresh from Facebook"
4. Check the server logs for these lines:
   ```
   [Facebook Pages] Meta returned: X Pages
   [Facebook Pages] After CREATE_CONTENT filter: Y Pages
   [Facebook Pages] Skipped: Z Pages (missing CREATE_CONTENT task)
   [Facebook Pages] Skipped Page IDs: ...
   ```

**Share the log output with me.**

Based on the logs, we can determine:

**If logs show:**
```
Meta returned: 12 Pages
After CREATE_CONTENT filter: 9 Pages
Skipped: 3 Pages (missing CREATE_CONTENT task)
```

**Then:**
- FeedWren is working correctly
- The 3 missing Pages do not have the `CREATE_CONTENT` task in Meta
- You need to grant the `CREATE_CONTENT` task for those Pages in Meta Business Suite

**If logs show:**
```
Meta returned: 9 Pages
After CREATE_CONTENT filter: 9 Pages
Skipped: 0 Pages (missing CREATE_CONTENT task)
```

**Then:**
- Meta itself is only returning 9 Pages
- This is a Meta permissions/access/token issue
- The 3 missing Pages may have different access levels or be excluded by Meta's API

---

## 6. POSSIBLE SOLUTIONS

### Option A: Grant CREATE_CONTENT Task in Meta (RECOMMENDED)

If the logs show 3 Pages are skipped due to missing `CREATE_CONTENT`:

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Navigate to the missing Pages
3. Grant the `CREATE_CONTENT` task for your app/user
4. In FeedWren, click "Refresh from Facebook"
5. The Pages should now appear

**Why this is recommended:**
- Preserves FeedWren's publish-time safety
- Ensures you can actually publish to all displayed Pages
- Follows Meta's permission model

### Option B: Remove CREATE_CONTENT Filter (NOT RECOMMENDED)

I can remove the `CREATE_CONTENT` filter to show all Pages regardless of task permissions.

**Risks:**
- You may see Pages you cannot publish to
- Publishing to a Page without `CREATE_CONTENT` will fail
- You would discover the problem at publish time (worse user experience)
- May violate Meta's permission expectations

**Only consider this if:**
- You are testing/diagnosing
- You want to see all Pages regardless of publish capability
- You accept the risk of publish-time failures

### Option C: Display Non-Publishable Pages with Warning

I can modify the UI to:
- Show all Pages including those without `CREATE_CONTENT`
- Display a warning icon/label for non-publishable Pages
- Prevent selecting non-publishable Pages as default

**Benefits:**
- Shows all Pages
- Clearly indicates which Pages are publishable
- Prevents selecting non-publishable Pages

**Requires:**
- Frontend UI changes
- Backend API changes to include task information
- More complex user experience

---

## 7. META API CONTEXT

According to Meta's Graph API documentation:

- The `/me/accounts` endpoint returns Pages the user has access to
- Each Page includes a `tasks` array indicating what operations are permitted
- The `CREATE_CONTENT` task is required to publish content to a Page
- A user may have "Admin" or "Moderator" access but still lack `CREATE_CONTENT`
- Task permissions are configured in Meta Business Suite Page settings

**Reference:** https://developers.facebook.com/docs/graph-api/reference/page/

---

## 8. FILES CHANGED

**Only 1 file changed:**

1. `src/lib/facebook/client.ts`
   - **Added:** Diagnostic logging to track Pages returned by Meta vs. Pages after filter
   - **Lines Changed:** Added 23 lines of diagnostic code
   - **Reason:** To determine whether Meta returns 12 or 9 Pages, and how many are filtered
   - **Risk:** None - logging is safe and read-only

---

## 9. TESTING

**Lint:** ✅ PASSED (0 errors, 31 warnings - all pre-existing)

**TypeScript:** ✅ PASSED

**Build:** Not run (pending diagnostic verification)

---

## 10. REMAINING MANUAL STEPS

**USER MUST PERFORM:**

1. Check server logs after clicking "Refresh from Facebook"
2. Share the diagnostic log output
3. Based on logs, choose one of the solutions above

**DO NOT CLAIM "12 PAGES FIXED" YET.**

The actual fix depends on what the diagnostic logs reveal.

---

## 11. NEXT STEPS

**Please share the server log output after refreshing Pages:**

```
[Facebook Pages] Meta returned: X Pages
[Facebook Pages] After CREATE_CONTENT filter: Y Pages
[Facebook Pages] Skipped: Z Pages (missing CREATE_CONTENT task)
[Facebook Pages] Skipped Page IDs: ...
```

Based on this information, I will:
- Confirm the exact cause
- Implement the appropriate fix
- Test the solution
- Provide a final report

---

## SUMMARY

**Current Status:**
- ✅ Pagination implemented correctly
- ✅ Frontend has no additional filtering
- ✅ Database has no additional filtering
- ⚠️ Backend filters Pages without `CREATE_CONTENT` task (by design)
- ⚠️ Need diagnostic logs to confirm Meta's actual response

**Most Likely Cause:**
The 3 missing Pages do not have the `CREATE_CONTENT` task in Meta, so FeedWren filters them out to prevent publish-time failures.

**Recommended Action:**
Check server logs, then grant `CREATE_CONTENT` task in Meta Business Suite for the missing Pages.

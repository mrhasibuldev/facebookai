# Instagram Setup Guide for FeedWren

**Updated:** October 7, 2026  
**FeedWren Version:** Current  
**Meta Documentation Verified:** October 7, 2026

---

## Before You Begin

This guide will walk you through setting up Instagram integration for FeedWren step-by-step. You will:

1. Create a Meta Developer App (or use an existing one)
2. Configure Instagram Business Login
3. Copy your Instagram App ID and App Secret
4. Paste them into FeedWren
5. Connect your Instagram account

**IMPORTANT:** This guide uses the current "Instagram API with Instagram Login" architecture. This means:
- You will use your Instagram credentials directly
- A Facebook Page is NOT required
- Facebook Login is NOT required
- Instagram authorization is independent from Facebook

**What You Need:**
- A Meta Developer account (free at developers.facebook.com)
- An Instagram Professional account (Business or Creator type)
- Your Meta account must be logged in
- About 15-20 minutes

**Official Meta Documentation:**
- Instagram API with Instagram Login: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
- Business Login for Instagram: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
- Create a Meta app for Instagram: https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app

---

## STEP 1 — Log Into Meta for Developers

### WHERE YOU ARE:
You are on the Meta for Developers home page.

### HOW TO GET THERE:
1. Open your web browser
2. Go to: https://developers.facebook.com
3. Click "Log In" in the top-right corner
4. Log in with your Facebook account

### WHAT YOU SHOULD SEE:
The Meta for Developers home page with your account information visible.

### WHAT TO CLICK:
No specific button needed here. Just ensure you are logged in.

### WHY:
You must be logged into a Meta Developer account to create or manage apps.

### CHECKPOINT:
You should see your name or profile in the top-right corner.

### NEXT:
Go to STEP 2.

---

## STEP 2 — Create a New Meta App

### WHERE YOU ARE:
You are about to create a new Meta Developer App.

### HOW TO GET THERE:
1. Make sure you are still on https://developers.facebook.com
2. Click "My Apps" in the top navigation menu
3. OR go directly to: https://developers.facebook.com/apps/creation/

### WHAT YOU SHOULD SEE:
The "Create an App" page with fields for App Name and Contact Email.

### WHAT TO CLICK:
The page loads automatically when you navigate to the URL above.

### WHAT TO TYPE:

**App Name:**
```
FeedWren Instagram Integration
```
(You can use any name, but this is clear and descriptive)

**Contact Email:**
```
your-email@example.com
```
(Use an email you check regularly. Meta will send notifications here.)

### WHAT NOT TO SELECT:
- Do not use special characters in the App Name that might cause issues
- Do not use an email you do not have access to

### WHY:
The App Name identifies your app in the Meta Developer Console. The Contact Email is where Meta sends important notifications about your app.

### WHAT HAPPENS NEXT:
After clicking "Next", you will see a list of use cases.

### CHECKPOINT:
You should see the "Use Cases" screen after clicking Next.

### NEXT:
Go to STEP 3.

---

## STEP 3 — Select Use Cases

### WHERE YOU ARE:
You are on the "Use Cases" screen during app creation.

### HOW TO GET THERE:
This screen appears automatically after completing STEP 2.

### WHAT YOU SHOULD SEE:
A list of use case categories such as:
- Manage Accounts
- Business tools
- Social media
- Authentication
- And others

### WHAT TO CLICK:
For FeedWren Instagram integration, select:

**Use Case:** `Other`

This is found at the bottom of the use case list.

### WHAT NOT TO SELECT:
- Do NOT select use cases that are grayed out (incompatible)
- Do NOT select use cases that require App Review immediately unless you need them

### WHY:
FeedWren uses the Instagram API with Instagram Login, which does not fit into standard use case categories. Selecting "Other" allows you to proceed with the correct app type.

### WHAT HAPPENS NEXT:
After selecting "Other" and clicking Next, you will see app type options.

### CHECKPOINT:
You should see "Business" and "Consumer" app type options.

### NEXT:
Go to STEP 4.

---

## STEP 4 — Select App Type

### WHERE YOU ARE:
You are on the "App Type" selection screen.

### HOW TO GET THERE:
This screen appears after selecting "Other" as the use case in STEP 3.

### WHAT YOU SHOULD SEE:
Two options:
- Business
- Consumer

### WHAT TO CLICK:
Select: **Business**

### WHAT NOT TO SELECT:
- Do NOT select "Consumer" — the Instagram product is NOT available for Consumer-type apps

### WHY:
Instagram API requires a Business-type app. Consumer apps cannot add the Instagram product or access Instagram Business Login.

### WHAT HAPPENS NEXT:
After clicking Next, you will see the Business Portfolio selection screen.

### CHECKPOINT:
You should see options for connecting a Business Portfolio.

### NEXT:
Go to STEP 5.

---

## STEP 5 — Connect Business Portfolio

### WHERE YOU ARE:
You are on the "Connect a Business" screen.

### HOW TO GET THERE:
This screen appears after selecting "Business" app type in STEP 4.

### WHAT YOU SHOULD SEE:
Options such as:
- A verified business portfolio
- An unverified business portfolio
- I don't want to connect a business portfolio yet
- Create a business portfolio

### WHAT TO CLICK:
For local development and testing, select:

**"I don't want to connect a business portfolio yet"**

### WHAT NOT TO SELECT:
- You do NOT need to create a Business Portfolio for development/testing
- You do NOT need a verified business portfolio for development/testing

### WHY:
Business Portfolio is only required for Advanced Access (App Review) and production use with external users. For your own development and testing, you can skip this for now and add it later when you are ready to submit for App Review.

### WHAT HAPPENS NEXT:
After clicking Next, you will see the App Review / Requirements screen.

### CHECKPOINT:
You should see a summary of your app details and any requirements.

### NEXT:
Go to STEP 6.

---

## STEP 6 — Review and Create App

### WHERE YOU ARE:
You are on the final review screen before app creation.

### HOW TO GET THERE:
This screen appears after completing the Business Portfolio selection in STEP 5.

### WHAT YOU SHOULD SEE:
A summary showing:
- App Name
- Contact Email
- Use Case: Other
- App Type: Business
- Business Portfolio: Not connected (or whatever you selected)
- Any requirements

### WHAT TO CLICK:
Click: **Create App**

### WHAT NOT TO DO:
- Do not skip reviewing the details
- Do not click Create App until you have verified the information is correct

### WHY:
This is your final chance to verify the app details before creation. After clicking Create App, the app will be created in Development Mode.

### WHAT HAPPENS NEXT:
Meta will create your app and redirect you to the App Dashboard.

### CHECKPOINT:
You should see the App Dashboard for your new app, with the App ID visible at the top.

### NEXT:
Go to STEP 7.

---

## STEP 7 — Navigate to App Dashboard

### WHERE YOU ARE:
You are now in the Meta App Dashboard for your newly created app.

### HOW TO GET THERE:
This screen loads automatically after STEP 6 completes.

### WHAT YOU SHOULD SEE:
The App Dashboard with:
- App ID displayed at the top
- Left sidebar menu with options like:
  - Dashboard
  - App Settings
  - Add Product
  - App Review
  - Roles
  - And others

### WHAT TO CLICK:
In the left sidebar, look for:
**Add Product**

### WHY:
You need to add the Instagram product to your app before you can configure Instagram Business Login.

### CHECKPOINT:
You should see the "Add Product" menu item in the left sidebar.

### NEXT:
Go to STEP 8.

---

## STEP 8 — Add Instagram Product

### WHERE YOU ARE:
You are in the "Add Product" section of the App Dashboard.

### HOW TO GET THERE:
1. In the left sidebar, click "Add Product"
2. This will show a list of available Meta products

### WHAT YOU SHOULD SEE:
A list of products such as:
- Facebook Login
- Instagram
- Messenger
- WhatsApp
- And others

### WHAT TO CLICK:
Find and click: **Instagram**

### WHAT NOT TO SELECT:
- Do NOT select "Facebook Login" — that is for Facebook integration, not Instagram
- Do NOT select "Facebook Login for Business" — that is for the old Instagram architecture

### WHY:
FeedWren uses the current Instagram API with Instagram Login architecture, which requires the Instagram product (not Facebook Login).

### WHAT HAPPENS NEXT:
After clicking Instagram, you will see the Instagram product setup screen.

### CHECKPOINT:
You should see "Instagram" in the left sidebar and the Instagram setup page on the right.

### NEXT:
Go to STEP 9.

---

## STEP 9 — Configure Instagram Business Login

### WHERE YOU ARE:
You are on the Instagram product setup page.

### HOW TO GET THERE:
This screen appears after adding the Instagram product in STEP 8.

### WHAT YOU SHOULD SEE:
Instagram setup sections such as:
- API setup with Instagram login
- Instagram Messenger
- Graph API

Under "API setup with Instagram login", you should see:
- 1. Set up Instagram business login
- 2. Instagram Business Login settings

### WHAT TO CLICK:
Click: **Set up** (under "1. Set up Instagram business login")

### WHY:
This opens the Instagram Business Login configuration, where you will add your redirect URI and configure permissions.

### WHAT HAPPENS NEXT:
A popup will appear showing the default permissions and a field for your Redirect URL.

### CHECKPOINT:
You should see a popup with "Instagram Business Login Setup" title.

### NEXT:
Go to STEP 10.

---

## STEP 10 — Add Redirect URI

### WHERE YOU ARE:
You are in the Instagram Business Login Setup popup.

### HOW TO GET THERE:
This popup appears after clicking "Set up" in STEP 9.

### WHAT YOU SHOULD SEE:
A popup with:
- A list of permissions (already selected by default)
- A field for "Redirect URL"
- A "Save" button

### WHAT TO TYPE:

**For Local Development:**
```
http://localhost:3000/api/instagram/oauth/callback
```

**For Production (when you deploy):**
```
https://yourdomain.com/api/instagram/oauth/callback
```

Replace `yourdomain.com` with your actual domain.

### WHAT NOT TO TYPE:
- Do NOT add a trailing slash at the end
- Do NOT use `https` for localhost (use `http`)
- Do NOT miss the `/api/instagram/oauth/callback` path
- Do NOT change the path structure

### WHY:
The Redirect URI is where Meta redirects users after they authorize your app. It must match exactly in both Meta and FeedWren. Even one character difference will cause an error.

### WHAT HAPPENS NEXT:
After clicking Save, the popup will close and you will return to the Instagram setup page.

### CHECKPOINT:
You should see "API setup with Instagram login" showing "Set up" changed to "Set up completed" or similar confirmation.

### NEXT:
Go to STEP 11.

---

## STEP 11 — Configure Additional OAuth Settings

### WHERE YOU ARE:
You are back on the Instagram product setup page.

### HOW TO GET THERE:
This is the same page from STEP 9, after saving the Redirect URI.

### WHAT YOU SHOULD SEE:
Under "API setup with Instagram login", you should now see:
- 1. Set up Instagram business login (completed)
- 2. Instagram Business Login settings

### WHAT TO CLICK:
Click: **Business login settings** (under "2. Instagram Business Login settings")

### WHY:
This opens additional OAuth configuration options, including:
- Additional OAuth Redirect URIs
- Deauthorize callback URL
- Data deletion request URL

### WHAT HAPPENS NEXT:
You will see the Business Login Settings page.

### CHECKPOINT:
You should see fields for OAuth Redirect URIs and other callback URLs.

### NEXT:
Go to STEP 12.

---

## STEP 12 — Verify OAuth Redirect URIs

### WHERE YOU ARE:
You are on the Instagram Business Login Settings page.

### HOW TO GET THERE:
This page opens after clicking "Business login settings" in STEP 11.

### WHAT YOU SHOULD SEE:
Fields such as:
- OAuth Redirect URIs
- Deauthorize callback URL
- Data deletion request URL

### WHAT TO CLICK:
The Redirect URI you added in STEP 10 should already appear in the "OAuth Redirect URIs" list.

### WHAT TO VERIFY:
Check that your Redirect URI appears in the list:
- `http://localhost:3000/api/instagram/oauth/callback` (for local)
- `https://yourdomain.com/api/instagram/oauth/callback` (for production)

### WHAT TO ADD:
If you need both local and production, add both URLs as separate entries in the OAuth Redirect URIs list.

### WHAT NOT TO DO:
- Do NOT remove the URI you added in STEP 10
- Do NOT use different paths

### WHY:
OAuth Redirect URIs must be pre-registered in Meta. Any redirect not in this list will be rejected.

### CHECKPOINT:
Your Redirect URI should be visible in the OAuth Redirect URIs list.

### NEXT:
Go to STEP 13.

---

## STEP 13 — Configure Permissions

### WHERE YOU ARE:
You are on the Instagram product setup page or App Review > Permissions and Features.

### HOW TO GET THERE:
1. In the left sidebar, click "App Review"
2. Then click "Permissions and Features"

### WHAT YOU SHOULD SEE:
A list of permissions with options to:
- Get Standard Access
- Get Advanced Access
- Remove

### WHAT TO VERIFY:
FeedWren requires these two permissions:

**Required Permissions:**
1. `instagram_business_basic` — Required for basic Instagram account access
2. `instagram_business_content_publish` — Required for publishing to Instagram

### WHAT TO CLICK:
If these permissions are not already in your list:
1. Search for each permission
2. Click "Get Standard Access" (for development)
3. OR "Get Advanced Access" (for production, requires Business Verification)

### WHAT NOT TO ADD:
- Do NOT add permissions you do not need
- Do NOT add deprecated permissions (e.g., `instagram_basic`, `instagram_content_publish` — these were deprecated January 27, 2025)

### WHY:
`instagram_business_basic` and `instagram_business_content_publish` are the current permission names for the Instagram API with Instagram Login. The old permission names are deprecated.

### CHECKPOINT:
You should see both `instagram_business_basic` and `instagram_business_content_publish` in your permissions list.

### NEXT:
Go to STEP 14.

---

## STEP 14 — Find Your Instagram App ID

### WHERE YOU ARE:
You are in the App Dashboard, Instagram product section.

### HOW TO GET THERE:
1. In the left sidebar, click "Instagram"
2. This shows the Instagram product page

### WHAT YOU SHOULD SEE:
The Instagram product page with:
- API setup with Instagram login
- Instagram Business Login settings

### WHAT TO CLICK:
Click: **API setup with Instagram login** (if not already expanded)

### WHAT TO LOOK FOR:
Look for a field labeled:
- **Instagram App ID**
- OR **App ID**

This may be displayed in:
- Instagram > API setup with Instagram login
- OR App Settings > Basic > App ID

### WHAT TO COPY:
Copy the **Instagram App ID** value.

**IMPORTANT:** This is the Instagram-specific App ID, NOT the main Meta App ID. These are different.

### WHY:
FeedWren needs the Instagram App ID (not the main App ID) to authenticate with Instagram OAuth.

### CHECKPOINT:
You should have copied a numeric value (e.g., 123456789012345).

### NEXT:
Go to STEP 15.

---

## STEP 15 — Find Your Instagram App Secret

### WHERE YOU ARE:
You are in the App Dashboard, Basic Settings or Instagram product section.

### HOW TO GET THERE:
1. In the left sidebar, click "App Settings"
2. Then click "Basic"

### WHAT YOU SHOULD SEE:
The Basic Settings page with:
- App ID
- App Secret (hidden by default)
- Other app information

### WHAT TO CLICK:
Look for the **App Secret** field.
Click the **Show** or **Reveal** button next to App Secret.

### WHAT TO COPY:
Copy the **App Secret** value.

**IMPORTANT SECURITY:**
- Never share your App Secret publicly
- Never commit it to Git
- Never put it in client-side JavaScript
- Store it only in secure server-side locations

### WHY:
FeedWren needs the App Secret to exchange authorization codes for access tokens. This secret must never be exposed to browsers.

### CHECKPOINT:
You should have copied a long alphanumeric string.

### NEXT:
Go to STEP 16.

---

## STEP 16 — Configure FeedWren

### WHERE YOU ARE:
You are now switching from Meta Developer Console to FeedWren.

### HOW TO GET THERE:
1. Open FeedWren in your browser: http://localhost:3000
2. Log in to your FeedWren account
3. Navigate to: Settings → Social Connect → Instagram

### WHAT YOU SHOULD SEE:
The Instagram configuration section with fields for:
- Instagram App ID
- Instagram App Secret
- Redirect URI (displayed, not editable)
- Save Configuration button

### WHAT TO PASTE:

**Instagram App ID:**
Paste the value you copied in STEP 14.

**Instagram App Secret:**
Paste the value you copied in STEP 15.

### WHAT NOT TO PASTE:
- Do NOT paste the main Meta App ID (use Instagram App ID)
- Do NOT paste anything else
- Do NOT leave fields blank

### WHY:
FeedWren uses these credentials to authenticate with Instagram OAuth and make API calls on your behalf.

### WHAT HAPPENS NEXT:
After clicking "Save Configuration", FeedWren will store these credentials securely in your database.

### CHECKPOINT:
The fields should show your pasted values and the Save button should indicate success.

### NEXT:
Go to STEP 17.

---

## STEP 17 — Connect Your Instagram Account

### WHERE YOU ARE:
You are in FeedWren Settings → Social Connect → Instagram, after saving configuration.

### WHAT YOU SHOULD SEE:
A "Connect Instagram" button and connection status.

### WHAT TO CLICK:
Click: **Connect Instagram**

### WHAT HAPPENS NEXT:
1. FeedWren will redirect you to Instagram's authorization page
2. You will see an Instagram login screen
3. You will see a permissions request screen
4. Instagram will ask you to authorize FeedWren to access your account

### WHAT TO AUTHORIZE:
Instagram will ask for permissions:
- Read your Instagram profile information (`instagram_business_basic`)
- Publish content to your Instagram account (`instagram_business_content_publish`)

Click: **Authorize** or **Allow**

### WHY:
This is the OAuth flow where you grant FeedWren permission to access your Instagram account and publish content.

### CHECKPOINT:
After authorizing, you should be redirected back to FeedWren Settings.

### NEXT:
Go to STEP 18.

---

## STEP 18 — Verify Connection

### WHERE YOU ARE:
You are back in FeedWren Settings → Social Connect → Instagram.

### WHAT YOU SHOULD SEE:
Connection status showing:
- Instagram username (e.g., @yourusername)
- Status: Connected
- A "Disconnect" button

### WHAT TO CHECK:
- Your Instagram username should be displayed
- Status should show "Connected"
- No error messages should appear

### WHAT TO DO IF NOT CONNECTED:
- Check that your Instagram account is a Professional account (Business or Creator)
- Check that you used the correct App ID and App Secret
- Check that the Redirect URI matches exactly in Meta and FeedWren
- Check the FeedWren logs for error messages

### WHY:
This confirms that the OAuth flow completed successfully and FeedWren has a valid Instagram access token.

### CHECKPOINT:
You should see your Instagram username and "Connected" status.

### NEXT:
Go to STEP 19.

---

## STEP 19 — Test Publishing

### WHERE YOU ARE:
You are now ready to test Instagram publishing in FeedWren.

### HOW TO GET THERE:
1. Navigate to FeedWren's Generate or Post section
2. Create a new post with an image
3. Select "Instagram only" as the destination

### WHAT TO TEST:
1. Generate a post with an image
2. Ensure the image URL is publicly accessible
3. Select Instagram as the destination
4. Click Publish
5. Check your Instagram account to verify the post appeared

### WHAT TO EXPECT:
- The post should appear on your Instagram account
- The image should be visible
- The caption should match what you entered in FeedWren

### WHAT TO DO IF PUBLISHING FAILS:
- Check that the image URL is publicly accessible
- Check that your Instagram account is Professional (Business or Creator)
- Check FeedWren logs for error messages
- Verify your Instagram access token is still valid

### WHY:
This confirms that the entire integration is working end-to-end.

### CHECKPOINT:
Your post should appear on your Instagram account.

### NEXT:
Congratulations! Instagram integration is complete.

---

## Account Requirements

### Instagram Account Type

**Required:**
- ✅ Instagram Professional — Business account
- ✅ Instagram Professional — Creator account

**Not Supported:**
- ❌ Personal Instagram account

**How to Check:**
1. Open Instagram app
2. Go to your profile
3. Tap "Edit Profile"
4. Look for "Professional account" or "Switch to Professional Account"

**How to Convert:**
If you have a personal account:
1. Go to Settings → Account → Switch to Professional Account
2. Choose "Business" or "Creator"
3. Follow the prompts

### Instagram Account Age
Your Instagram account should be established (not brand new) to avoid restrictions.

### Meta Account
You must have a Meta Developer account with access to the Meta Developer Console.

---

## Facebook Dependency

### Do I Need Facebook for Instagram Integration?

**NO.**

**Facebook Page Required:** ❌ NO  
**Facebook Login Required:** ❌ NO  
**Facebook Account Required:** Only for Meta Developer Console access (not for Instagram OAuth)

**Why:**
FeedWren uses the current "Instagram API with Instagram Login" architecture. This architecture explicitly states that a Facebook Page is NOT required. Instagram authorization is direct through Instagram credentials.

**Important:**
- Facebook and Instagram are separate FeedWren integrations
- Even though Meta may allow both in one Developer App, Instagram does NOT depend on Facebook Pages
- You can use Instagram without connecting Facebook
- You can use Facebook without connecting Instagram

---

## Development Mode vs Production

### What is Development Mode?

When you create a new Meta app, it starts in **Development Mode**. This is the default state for all new apps.

### Who Can Connect in Development Mode?

In Development Mode:
- ✅ The app owner (you) can connect your own Instagram account
- ✅ Test users added in Roles > Test Users can connect
- ❌ External users cannot connect

### What is the App Owner Required to Do?

As the app owner:
1. Ensure your Instagram account is Professional (Business or Creator)
2. Complete the setup steps in this guide
3. Connect your own account for testing
4. Add test users if needed for additional testing

### What Does a Test User Need to Do?

Test users:
1. Are added by the app owner in Roles > Test Users
2. Receive an invitation or login URL
3. Can connect their Instagram accounts for testing
4. Must have Professional Instagram accounts

### When Does App Review Matter?

App Review is required when:
- You want external users (not you or test users) to use your app
- You need Advanced Access to certain permissions
- You want to switch from Development Mode to Live Mode

### When is Advanced Access Required?

Advanced Access is required for:
- Publishing to Instagram for external users
- Accessing certain advanced features
- Apps targeting public users

Advanced Access requires:
- Business Verification
- App Review approval
- Possibly additional documentation

### When Can a Normal Customer Use the Integration?

Normal customers can use the integration when:
- The app is in Live Mode
- The app has passed App Review
- Advanced Access has been granted for required permissions
- The customer has a Professional Instagram account

---

## Permissions Table

| Permission | Required? | Where to Add | Why FeedWren Needs It | What It Allows | Development Requirement | Production Requirement |
|-----------|-----------|--------------|----------------------|----------------|------------------------|------------------------|
| `instagram_business_basic` | ✅ YES | App Review > Permissions and Features | Basic Instagram account access (username, profile info) | Read Instagram profile and account details | Standard Access (automatic) | Standard Access or Advanced Access |
| `instagram_business_content_publish` | ✅ YES | App Review > Permissions and Features | Publish content to Instagram | Create and publish posts to Instagram | Standard Access (automatic) | Advanced Access (requires Business Verification) |

### Where to Add Permissions

1. In App Dashboard, click "App Review" in left sidebar
2. Click "Permissions and Features"
3. Search for each permission
4. Click "Get Standard Access" (for development)
5. OR "Get Advanced Access" (for production)

### Important Notes

- **Deprecated Permissions:** Do NOT use `instagram_basic` or `instagram_content_publish` — these were deprecated January 27, 2025
- **Current Permissions:** Always use `instagram_business_basic` and `instagram_business_content_publish`
- **Standard Access:** Available automatically in Development Mode for the app owner and test users
- **Advanced Access:** Requires Business Verification and App Review for production use with external users

---

## Redirect URI — Detailed Explanation

### What is a Redirect URI?

A Redirect URI (Uniform Resource Identifier) is the URL where Meta redirects users after they complete the OAuth authorization flow. When a user clicks "Authorize" on Instagram, Meta sends them back to this URL with an authorization code.

### Why Does FeedWren Need It?

FeedWren needs the Redirect URI to:
1. Receive the authorization code from Meta
2. Exchange the code for an access token
3. Complete the OAuth flow successfully

### Where Do I Add It?

**In Meta Developer Console:**
- Instagram > API setup with Instagram login > Business login settings
- Add to "OAuth Redirect URIs" field

**In FeedWren:**
- Settings → Social Connect → Instagram
- Displayed automatically (you don't need to enter it)
- Click "Copy" button to copy it

### What Exact Value Should I Enter?

**For Local Development:**
```
http://localhost:3000/api/instagram/oauth/callback
```

**For Production:**
```
https://yourdomain.com/api/instagram/oauth/callback
```

### Important Rules

- **Exact Matching:** The URI in Meta must match FeedWren exactly
- **No Trailing Slash:** Do NOT add `/` at the end
- **Protocol:** Use `http` for localhost, `https` for production
- **Path:** The path must be `/api/instagram/oauth/callback`
- **Case Sensitivity:** URLs are case-sensitive
- **One Character Difference:** Even one wrong character will cause an error

### Why Even One Character Difference Causes an Error

Meta validates the Redirect URI for security. If the URI doesn't match exactly, Meta rejects the request to prevent OAuth attacks. This is a security feature, not a bug.

---

## App ID and App Secret — Detailed Explanation

### Where Do I Find My App ID and App Secret?

**App ID Location:**
- Instagram > API setup with Instagram login
- OR App Settings > Basic > App ID

**App Secret Location:**
- App Settings > Basic > App Secret
- Click "Show" or "Reveal" to see it

### Which Credentials Should I Use?

**IMPORTANT:** FeedWren uses the **Instagram-specific App ID and App Secret**, NOT the main Meta App ID and App Secret.

However, in the current Meta interface, the Instagram product uses the same App ID and App Secret as the main app. There is no separate "Instagram App ID" — the main App ID is used for all products including Instagram.

### What the ID Looks Like

**App ID:** A numeric string, e.g., `123456789012345`

**App Secret:** A long alphanumeric string, e.g., `abcd1234efgh5678`

### How to Reveal App Secret

1. Go to App Settings > Basic
2. Find the App Secret field
3. Click "Show" or "Reveal"
4. Copy the value

### Security Best Practices

- ✅ Store App Secret in server-side environment variables or database
- ✅ Never expose App Secret to browser/client-side code
- ✅ Never commit App Secret to Git
- ✅ Never share App Secret publicly
- ✅ Use different secrets for development and production
- ❌ Do NOT put App Secret in React components
- ❌ Do NOT put App Secret in public config files
- ❌ Do NOT include App Secret in screenshots

---

## Meta UI Variations

### What If My Screen Looks Different?

Meta frequently changes the Developer Console interface. If your screen looks different from this guide:

1. **Look for Purpose, Not Exact Labels**
   - If you don't see "Add Product", look for "Products" or "Add" buttons
   - If you don't see "Use Cases", look for "App Type" or "App Category"
   - If you don't see "Business Portfolio", look for "Business" or "Business Account"

2. **Check Left Sidebar Navigation**
   - Most settings are in the left sidebar
   - Look for "App Settings", "Instagram", "App Review", "Roles"

3. **Use Search**
   - Many dashboards have a search feature
   - Search for "Instagram", "Permissions", "OAuth"

4. **Check App Dashboard Home**
   - The main dashboard often shows required actions
   - Look for "Setup required" or "Configuration needed" alerts

5. **Refer to Official Documentation**
   - Meta's official documentation is always current
   - https://developers.facebook.com/documentation/instagram-platform/

### Known UI Variations

**App Creation:**
- Some accounts see "Use Cases" first
- Some accounts see "App Type" first
- Business Portfolio may be required for some account types

**Instagram Product:**
- May be under "Products" or "Add Product"
- May show "Instagram Login" or "Instagram Business Login"
- Permissions may be in "App Review" or "Instagram" section

**OAuth Settings:**
- May be called "OAuth Redirect URIs" or "Valid OAuth Redirect URIs"
- May be in "Instagram > Business Login settings" or "Facebook Login > Settings"

---

## Troubleshooting

### Problem: I Cannot Find "Create App"

**Why It Happens:**
- You may not be logged into Meta for Developers
- You may not have a Meta Developer account

**How to Check:**
- Check if you see your profile in the top-right corner
- Try logging in at https://developers.facebook.com

**Fix:**
1. Log in with your Facebook account
2. Register as a Meta Developer (free)
3. Try again

**Next Step:**
Proceed to STEP 2.

---

### Problem: I Cannot Find "User Access"

**Why It Happens:**
- Meta changed the interface
- "User Access" is no longer a separate selection during app creation

**How to Check:**
- Look for "Use Cases" or "App Type" instead
- Check if you are in the current app creation flow

**Fix:**
- Select "Other" as Use Case
- Select "Business" as App Type
- Configure access through Instagram product settings

**Next Step:**
Proceed to STEP 4.

---

### Problem: I Don't Know What to Select Under Use Cases

**Why It Happens:**
- FeedWren uses Instagram API which doesn't fit standard use cases

**How to Check:**
- Look at the bottom of the use case list

**Fix:**
- Select "Other" at the bottom of the list
- Then select "Business" as App Type

**Next Step:**
Proceed to STEP 4.

---

### Problem: I Cannot Find "Add Product"

**Why It Happens:**
- UI may show "Products" instead
- May be in a different menu location

**How to Check:**
- Check left sidebar for "Products"
- Check top navigation for "Add"

**Fix:**
- Look for "Products" in left sidebar
- Click on it to see available products

**Next Step:**
Proceed to STEP 8.

---

### Problem: Instagram Is Not Shown in Products

**Why It Happens:**
- Your app is Consumer type instead of Business type
- Instagram is not available for Consumer apps

**How to Check:**
- Go to App Settings > Basic
- Check App Type

**Fix:**
- Delete the Consumer app
- Create a new Business app (see STEP 4)

**Next Step:**
Start over from STEP 2.

---

### Problem: Instagram Configuration Is Missing

**Why It Happens:**
- Instagram product not added properly
- App creation incomplete

**How to Check:**
- Check left sidebar for "Instagram"
- If missing, add Instagram product again

**Fix:**
- Click "Add Product"
- Select "Instagram"
- Click "Set up"

**Next Step:**
Proceed to STEP 9.

---

### Problem: I Don't Know Which Instagram Login Option to Choose

**Why It Happens:**
- Meta shows multiple Instagram options

**How to Check:**
- Look for "API setup with Instagram login"
- Look for "Instagram Business Login"

**Fix:**
- Select "API setup with Instagram login"
- This is the current architecture

**Next Step:**
Proceed to STEP 9.

---

### Problem: Permission Is Missing

**Why It Happens:**
- Permission not added to app
- Permission not available for app type

**How to Check:**
- Go to App Review > Permissions and Features
- Search for the permission

**Fix:**
- Search for `instagram_business_basic`
- Click "Get Standard Access"
- Repeat for `instagram_business_content_publish`

**Next Step:**
Proceed to STEP 13.

---

### Problem: Permission Cannot Be Added

**Why It Happens:**
- App is Consumer type instead of Business type
- Permission requires Advanced Access

**How to Check:**
- Check App Type in App Settings > Basic
- Check if permission requires Advanced Access

**Fix:**
- Ensure app is Business type
- For Advanced Access, complete Business Verification and App Review

**Next Step:**
Proceed to STEP 4 if app type is wrong.

---

### Problem: Permission Requires Advanced Access

**Why It Happens:**
- Some permissions require Advanced Access for production use
- Business Verification may be required

**How to Check:**
- Permission shows "Advanced Access" instead of "Standard Access"

**Fix:**
- For development: use Standard Access (works for you and test users)
- For production: complete Business Verification and App Review

**Next Step:**
See "Development Mode vs Production" section.

---

### Problem: App Review Is Required

**Why It Happens:**
- You want to use the app with external users
- You need Advanced Access

**How to Check:**
- App Dashboard shows "App Review" required
- Permissions show "Advanced Access" needed

**Fix:**
- Complete Business Verification
- Submit app for App Review
- Provide required documentation

**Next Step:**
Follow Meta's App Review process documentation.

---

### Problem: Redirect URI Invalid

**Why It Happens:**
- URI doesn't match exactly between Meta and FeedWren
- Missing protocol (http/https)
- Wrong path
- Trailing slash

**How to Check:**
- Compare URI in Meta Business Login settings
- Compare URI in FeedWren Settings

**Fix:**
- Ensure exact match
- Remove trailing slash
- Check protocol (http for localhost, https for production)
- Verify path is `/api/instagram/oauth/callback`

**Next Step:**
Proceed to STEP 10.

---

### Problem: OAuth Callback Error

**Why It Happens:**
- App ID or App Secret incorrect
- Redirect URI mismatch
- State parameter invalid

**How to Check:**
- Check FeedWren logs for error message
- Check App ID and App Secret in FeedWren
- Check Redirect URI in Meta

**Fix:**
- Verify App ID is correct
- Verify App Secret is correct
- Verify Redirect URI matches exactly
- Try connecting again

**Next Step:**
Proceed to STEP 16.

---

### Problem: Invalid App ID

**Why It Happens:**
- Wrong App ID copied
- Main App ID used instead of Instagram context
- App ID not found

**How to Check:**
- Compare App ID in Meta and FeedWren
- Ensure you copied the numeric value

**Fix:**
- Copy App ID from App Settings > Basic
- Or from Instagram > API setup with Instagram login
- Paste into FeedWren

**Next Step:**
Proceed to STEP 14.

---

### Problem: Invalid App Secret

**Why It Happens:**
- Wrong App Secret copied
- App Secret not revealed before copying
- App Secret changed

**How to Check:**
- Click "Show" or "Reveal" in Meta
- Copy the full string

**Fix:**
- Reveal App Secret in App Settings > Basic
- Copy the full value
- Paste into FeedWren

**Next Step:**
Proceed to STEP 15.

---

### Problem: Instagram Account Not Eligible

**Why It Happens:**
- Instagram account is Personal (not Professional)
- Account is too new
- Account has restrictions

**How to Check:**
- Open Instagram app
- Check if account is Professional (Business or Creator)

**Fix:**
- Convert account to Professional
- Settings → Account → Switch to Professional Account
- Choose Business or Creator

**Next Step:**
Try connecting again after conversion.

---

### Problem: Personal Instagram Account Doesn't Work

**Why It Happens:**
- Instagram API only supports Professional accounts
- Personal accounts cannot use Business Login

**How to Check:**
- Instagram profile shows "Professional account" badge

**Fix:**
- Convert to Professional account
- Settings → Account → Switch to Professional Account

**Next Step:**
Try connecting again after conversion.

---

### Problem: Instagram Connection Succeeds but FeedWren Shows No Account

**Why It Happens:**
- OAuth completed but account info not retrieved
- Token exchange failed
- Database insert failed

**How to Check:**
- Check FeedWren logs for errors
- Check browser console for errors

**Fix:**
- Check network tab for failed requests
- Verify token exchange succeeded
- Check database for connection record

**Next Step:**
Contact support with logs.

---

### Problem: User Is Not Authorized

**Why It Happens:**
- User not added as test user
- App in Development Mode and user is not owner/tester
- Token expired

**How to Check:**
- Check if user is app owner
- Check if user is in Roles > Test Users

**Fix:**
- Add user as test user in Roles > Test Users
- OR switch app to Live Mode with App Review

**Next Step:**
See "Development Mode vs Production" section.

---

### Problem: App Is in Development Mode

**Why It Happens:**
- All new apps start in Development Mode
- This is normal for development

**How to Check:**
- App Dashboard shows Development Mode

**Fix:**
- For development: this is expected behavior
- For production: submit for App Review and switch to Live Mode

**Next Step:**
See "Development Mode vs Production" section.

---

### Problem: Test User Cannot Connect

**Why It Happens:**
- Test user not added properly
- Test user doesn't have Professional Instagram account
- Test user invitation not accepted

**How to Check:**
- Check Roles > Test Users
- Verify test user exists
- Verify test user accepted invitation

**Fix:**
- Add test user in Roles > Test Users
- Send invitation
- Ensure test user accepts
- Ensure test user has Professional Instagram account

**Next Step:**
Try connecting again.

---

### Problem: Meta Asks for Business Verification

**Why It Happens:**
- You need Advanced Access
- You want to use app with external users
- You are switching to Live Mode

**How to Check:**
- App Dashboard shows Business Verification required
- App Review shows Business Verification step

**Fix:**
- Complete Business Verification in Meta Business Manager
- Provide required documents
- Wait for verification

**Next Step:**
Follow Meta's Business Verification documentation.

---

### Problem: Meta UI Looks Different

**Why It Happens:**
- Meta frequently changes the Developer Console
- Different account types see different interfaces

**How to Check:**
- Compare to official Meta documentation
- Look for alternative labels

**Fix:**
- Look for purpose instead of exact labels
- Check left sidebar navigation
- Refer to official Meta documentation
- Search for relevant terms

**Next Step:**
See "Meta UI Variations" section.

---

### Problem: Existing Meta App Was Created Previously

**Why It Happens:**
- You already have a Meta app
- You want to add Instagram to existing app

**How to Check:**
- Go to https://developers.facebook.com/apps
- See your existing apps

**Fix:**
- Open your existing app
- Add Instagram product (STEP 8)
- Configure Instagram Business Login (STEP 9)
- Ensure app is Business type

**Next Step:**
Proceed from STEP 8.

---

### Problem: User Already Has a Facebook App

**Why It Happens:**
- You have a Facebook app and want to add Instagram
- Facebook and Instagram can use the same app

**How to Check:**
- Check if existing app is Business type

**Fix:**
- If app is Business type: add Instagram product
- If app is Consumer type: create new Business app

**Next Step:**
Proceed from STEP 8 if app is Business type.

---

### Problem: User Created the Wrong App Type/Use Case

**Why It Happens:**
- Selected Consumer instead of Business
- Selected wrong use case

**How to Check:**
- Go to App Settings > Basic
- Check App Type

**Fix:**
- Delete the wrong app
- Create new Business app (start from STEP 2)

**Next Step:**
Start over from STEP 2.

---

## Progress Checklist

Use this checklist to track your progress through the setup process.

### Meta Developer Console Setup

- [ ] Logged into Meta for Developers
- [ ] Created new Meta App
- [ ] Selected "Other" as Use Case
- [ ] Selected "Business" as App Type
- [ ] Skipped Business Portfolio (for development)
- [ ] Created app successfully
- [ ] Added Instagram product
- [ ] Configured Instagram Business Login
- [ ] Added Redirect URI to Meta
- [ ] Verified OAuth Redirect URIs
- [ ] Added `instagram_business_basic` permission
- [ ] Added `instagram_business_content_publish` permission
- [ ] Copied Instagram App ID
- [ ] Copied Instagram App Secret

### FeedWren Configuration

- [ ] Opened FeedWren Settings
- [ ] Navigated to Social Connect → Instagram
- [ ] Pasted Instagram App ID
- [ ] Pasted Instagram App Secret
- [ ] Saved Instagram Configuration
- [ ] Clicked "Connect Instagram"
- [ ] Authorized FeedWren on Instagram
- [ ] Verified connection shows as connected
- [ ] Confirmed Instagram username displayed

### Testing

- [ ] Generated a test post
- [ ] Selected Instagram as destination
- [ ] Published test post
- [ ] Verified post appeared on Instagram
- [ ] Confirmed image is visible
- [ ] Confirmed caption is correct

---

## Official Sources

All information in this guide is based on official Meta documentation verified on October 7, 2026.

### Official Meta Documentation

- **Meta for Developers:** https://developers.facebook.com
- **App Dashboard:** https://developers.facebook.com/documentation/development/create-an-app/app-dashboard
- **Create an App with Meta:** https://developers.facebook.com/docs/development/create-an-app
- **Create a Meta app for Instagram:** https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app
- **Instagram API with Instagram Login:** https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
- **Business Login for Instagram:** https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
- **Instagram Permissions:** https://developers.facebook.com/docs/permissions
- **Access Levels:** https://developers.facebook.com/docs/graph-api/overview/access-levels
- **App Review:** https://developers.facebook.com/docs/app-review
- **Business Verification:** https://developers.facebook.com/docs/verification

### Documentation Last Verified

October 7, 2026

### Note on Meta UI Changes

Meta frequently changes the Developer Console interface. If you encounter a screen that looks different from this guide, refer to the official Meta documentation linked above. The core concepts and requirements remain the same even if the UI labels change.

---

## Support

If you encounter issues not covered in this troubleshooting section:

1. Check the official Meta documentation
2. Check FeedWren logs for error messages
3. Ensure your Instagram account is Professional (Business or Creator)
4. Verify all credentials are correct
5. Verify Redirect URI matches exactly
6. Ensure app is Business type (not Consumer)

For Meta-specific issues, refer to Meta Developer Support:
https://developers.facebook.com/support

---

## Summary

To integrate Instagram with FeedWren:

1. **Create a Business-type Meta App** (or use existing Business app)
2. **Add Instagram product** to the app
3. **Configure Instagram Business Login** with your Redirect URI
4. **Add required permissions** (`instagram_business_basic`, `instagram_business_content_publish`)
5. **Copy App ID and App Secret** from Meta
6. **Paste credentials into FeedWren** Settings
7. **Connect your Instagram account** through OAuth
8. **Test publishing** to verify the integration

**Key Points:**
- Facebook Page is NOT required
- Facebook Login is NOT required
- Instagram is independent from Facebook
- Instagram account must be Professional (Business or Creator)
- Use current permission names (not deprecated ones)
- Development Mode works for you and test users
- Production requires App Review and Business Verification

---

**End of Guide**

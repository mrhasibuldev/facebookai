# FeedWren - সেটআপ গাইড (বাংলা)

## 📋 সমস্যা এবং সমাধান

### সমস্যা ১: "Loading..." এ আটকে থাকা
**কারণ:**
- Root page (`src/app/page.tsx`) এ কেবল "Loading..." টেক্সট ছিল, কোনো রিডাইরেক্ট লজিক ছিল না
- Middleware রিডাইরেক্ট করছিল কিন্তু পেজ আপডেট হচ্ছিল না

**সমাধান:**
- Root page এ client-side redirect যোগ করা হয়েছে `/login` এ
- useEffect hook দিয়ে automatic redirect যোগ করা হয়েছে

### সমস্যা ২: Supabase Database সেটআপ হয়নি
**কারণ:**
- `supabase/schema.sql` ফাইলটি Supabase SQL Editor এ রান করা হয়নি
- টেবিল এবং policies তৈরি হয়নি

**সমাধান:**
- Database কানেকশন ফেইল হলে সুন্দর error message দেখানো হয়
- User কে SQL schema রান করতে বলা হয়

### সমস্যা ৩: Middleware Error Handling
**কারণ:**
- Database connection ফেইল হলে middleware রিডাইরেক্ট করছিল না
- User অনেকক্ষণ "Loading..." দেখতে থাকত

**সমাধান:**
- Middleware এ error handling যোগ করা হয়েছে
- Database error হলে `/login?error=database` এ রিডাইরেক্ট করা হয়

## 🚀 সম্পূর্ণ সেটআপ প্রক্রিয়া

### ধাপ ১: Supabase Database সেটআপ (অত্যাবশ্যক)

1. **Supabase Dashboard এ যান:**
   - https://supabase.com/dashboard

2. **SQL Editor খুলুন:**
   - বাম sidebar এ "SQL Editor" এ ক্লিক করুন
   - "New query" বাটনে ক্লিক করুন

3. **SQL Schema রান করুন:**
   - `supabase/schema.sql` ফাইলটি খুলুন
   - সম্পূর্ণ SQL কপি করুন
   - SQL Editor এ পেস্ট করুন
   - "Run" বাটনে ক্লিক করুন

4. **Verify করুন:**
   - কোনো error আসলে দেখুন
   - "Success" দেখালে ঠিক আছে

### ধাপ ২: Environment Variables চেক করুন

`.env.local` ফাইলে নিচের variables থাকতে হবে:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=admin123
SESSION_SECRET=random-long-string
```

### ধাপ ৩: Server Restart করুন

```bash
# Server বন্ধ করুন (যদি চলছে)
Ctrl+C

# Server আবার চালু করুন
npm run dev
```

### ধাপ ৪: Browser এ চেক করুন

1. http://localhost:3000 এ যান
2. এখন আপনি `/login` পেজে রিডাইরেক্ট হবেন
3. "Sign up" ক্লিক করে নতুন অ্যাকাউন্ট তৈরি করুন
4. অথবা যদি আগে অ্যাকাউন্ট থাকে তবে "Sign in" করুন

## 🔧 সমস্যা সমাধান

### সমস্যা: "Database not configured" error
**সমাধান:**
- Supabase SQL Editor এ `supabase/schema.sql` রান করুন
- Server restart করুন

### সমস্যা: সাইন-ইন করতে পারছেন না
**সমাধান:**
- Database schema রান হয়েছে কিনা চেক করুন
- Environment variables সঠিক কিনা দেখুন
- Browser cookies clear করে আবার চেষ্টা করুন

### সমস্যা: Dashboard এ যেতে পারছেন না
**সমাধান:**
- Login successful হয়েছে কিনা চেক করুন
- Middleware logs দেখুন (`console.log` output)
- Session cookie সঠিকভাবে set হয়েছে কিনা দেখুন

## 📝 কোড পরিবর্তনসমূহ

### 1. `src/app/page.tsx`
- Client-side redirect যোগ করা হয়েছে
- `useEffect` hook দিয়ে `/login` এ redirect করা হয়

### 2. `middleware.ts`
- Database error handling যোগ করা হয়েছে
- Missing env vars এর জন্য redirect যোগ করা হয়েছে
- Error state এ `/login?error=database` এ redirect করা হয়

### 3. `src/app/login/page.tsx`
- Database error message display যোগ করা হয়েছে
- `useEffect` দিয়ে URL parameter check করা হয়
- Better error messages যোগ করা হয়েছে

### 4. `src/lib/supabase/client.ts`
- Database connection error detection যোগ করা হয়েছে
- User-friendly error messages যোগ করা হয়েছে

### 5. `src/app/signup/page.tsx`
- Database error handling যোগ করা হয়েছে
- Better error messages যোগ করা হয়েছে

## ✅ যাচাই করার তালিকা

- [ ] Supabase SQL schema রান করা হয়েছে
- [ ] Environment variables সঠিকভাবে সেট করা হয়েছে
- [ ] Server restart করা হয়েছে
- [ ] Browser এ http://localhost:3000 এ যাওয়া হয়েছে
- [ ] Login/Signup পেজে রিডাইরেক্ট হয়েছে
- [ ] নতুন অ্যাকাউন্ট তৈরি করা হয়েছে
- [ ] Dashboard এ যাওয়া সম্ভব হয়েছে

## 🎯 পরবর্তী ধাপসমূহ

একবার অ্যাপ চালু হয়ে গেলে:

1. **Facebook App সেটআপ:**
   - Meta Developer Portal এ গিয়ে app তৈরি করুন
   - App ID এবং App Secret পান
   - Dashboard Settings এ যোগ করুন

2. **Facebook Connect:**
   - Settings পেজ থেকে Facebook এ connect করুন
   - আপনার Page সিলেক্ট করুন

3. **First Post:**
   - Topics যোগ করুন
   - Manual post তৈরি করে টেস্ট করুন
   - Autopilot enable করুন

## 📞 সাহায্য প্রয়োজন হলে

যদি এখনো সমস্যা থাকে:
1. Server logs চেক করুন
2. Browser console errors দেখুন
3. Supabase logs চেক করুন
4. Environment variables আবার verify করুন

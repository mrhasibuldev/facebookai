import { listPosts } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { isFacebookConnected } from "@/lib/types";
import type { Post } from "@/lib/types";
import { DashboardContent } from "./dashboard-content";
import { getDatabaseErrorMessage, logError } from "@/lib/errors";
import { SetupNeededClient } from "./setup-needed-client";

function buildChartData(posted: { posted_at: string | null }[]) {
  const days = 14;
  const counts = new Map<string, number>();
  const today = new Date();

  const labels: { date: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, 0);
    labels.push({ date: key, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }

  for (const post of posted) {
    if (!post.posted_at) continue;
    const key = post.posted_at.slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return labels.map((l) => ({ ...l, count: counts.get(l.date) ?? 0 }));
}



export default async function DashboardOverviewPage() {
  let posts: Post[] = [];
  let settings: Awaited<ReturnType<typeof getSettings>> | null = null;
  let error: string | null = null;

  try {
    console.log("[Dashboard] Fetching data...");
    [posts, settings] = await Promise.all([listPosts({ limit: 200 }), getSettings()]);
    console.log("[Dashboard] Data fetched successfully");
  } catch (err) {
    console.error("[Dashboard] Error fetching data:", err);
    logError("Dashboard", err);
    const errorObj = err && typeof err === 'object' && 'message' in err ? err as { message?: string; code?: string } : null;
    error = getDatabaseErrorMessage(errorObj);

    // If it's an authentication error, the middleware should have caught this
    // but as a fallback, show the setup needed page
    if (errorObj?.message?.includes('not authenticated') || errorObj?.message?.includes('Unauthorized')) {
      console.log("[Dashboard] Authentication error - user should be redirected by middleware");
      error = "Authentication required. Please sign in.";
    }
  }

  if (error || !settings) {
    return <SetupNeededClient reason={error || "Failed to load settings"} />;
  }

  const posted = posts.filter((p: Post) => p.status === "posted");
  const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
  const postedThisWeek = posted.filter((p: Post) => p.posted_at && new Date(p.posted_at) > weekAgo);
  const scheduled = posts.filter((p: Post) => p.status === "scheduled");
  const failed = posts.filter((p: Post) => p.status === "failed");
  const recent = posts.slice(0, 8);
  const connected = isFacebookConnected(settings);

  const chartData = buildChartData(posted);

  return <DashboardContent posts={posts} settings={settings} posted={posted} postedThisWeek={postedThisWeek} scheduled={scheduled} failed={failed} recent={recent} connected={connected} chartData={chartData} />;
}

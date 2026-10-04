import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PostsChart } from "@/components/dashboard/posts-chart";
import { listPosts } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { isFacebookConnected } from "@/lib/types";
import type { Post } from "@/lib/types";
import { DashboardContent } from "./dashboard-content";

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

/**
 * Shown when the dashboard cannot read its own database.
 *
 * This is the first screen of a fresh install, so it has to be useful: an
 * unhandled throw here becomes React error #441, whose message production
 * deliberately redacts, leaving a new user with "Something went wrong" and
 * nothing to act on. The cause is almost always one of three setup steps, so
 * they are named directly, along with the underlying error.
 */
function SetupNeeded({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-warning/40 bg-warning/5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <SetupNeededIcon />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-foreground">
              The database isn&apos;t set up yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything else is deployed correctly — this screen just cannot read
              from Supabase. It is almost always one of these:
            </p>

            <ol className="mt-4 space-y-3 text-sm text-foreground">
              <li>
                <span className="font-semibold">The schema was never run.</span>{" "}
                <span className="text-muted-foreground">
                  In Supabase, open <strong>SQL Editor → New query</strong>, paste
                  the whole of <code className="rounded bg-surface-2 px-1 text-xs">supabase/schema.sql</code>{" "}
                  from the repository, and click Run. This is step 1 of the guide
                  and the most common thing to miss.
                </span>
              </li>
              <li>
                <span className="font-semibold">An environment variable is wrong.</span>{" "}
                <span className="text-muted-foreground">
                  In Vercel, check{" "}
                  <code className="rounded bg-surface-2 px-1 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                  and{" "}
                  <code className="rounded bg-surface-2 px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>.
                  The key must be the <strong>service_role</strong> one, not{" "}
                  <code className="rounded bg-surface-2 px-1 text-xs">anon</code>. After
                  changing either, redeploy — Vercel only applies variables to new
                  deployments.
                </span>
              </li>
              <li>
                <span className="font-semibold">The Supabase project is paused.</span>{" "}
                <span className="text-muted-foreground">
                  Free projects pause after a stretch of inactivity. Open your
                  Supabase dashboard and resume it; your data is still there.
                </span>
              </li>
            </ol>

            <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs break-words text-muted-foreground">
              {reason}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SetupNeededIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-warning">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  );
}

export default async function DashboardOverviewPage() {
  let posts: Post[];
  let settings: Awaited<ReturnType<typeof getSettings>>;

  try {
    [posts, settings] = await Promise.all([listPosts({ limit: 200 }), getSettings()]);
  } catch (err) {
    return <SetupNeeded reason={err instanceof Error ? err.message : String(err)} />;
  }

  const posted = posts.filter((p: Post) => p.status === "posted");
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const postedThisWeek = posted.filter((p: Post) => p.posted_at && new Date(p.posted_at).getTime() > weekAgo);
  const scheduled = posts.filter((p: Post) => p.status === "scheduled");
  const failed = posts.filter((p: Post) => p.status === "failed");
  const recent = posts.slice(0, 8);
  const connected = isFacebookConnected(settings);

  const chartData = buildChartData(posted);

  return <DashboardContent posts={posts} settings={settings} posted={posted} postedThisWeek={postedThisWeek} scheduled={scheduled} failed={failed} recent={recent} connected={connected} chartData={chartData} />;
}

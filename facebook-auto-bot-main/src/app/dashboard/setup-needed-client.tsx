"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SetupNeededClient({ reason }: { reason: string }) {
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-2xl px-4">
      <Card className="border-warning/40 bg-warning/5">
        <div className="flex flex-col sm:flex-row items-start gap-3 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <SetupNeededIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-foreground">
              Database Connection Error
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reason}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              This is usually caused by one of these issues:
            </p>

            <ol className="mt-4 space-y-3 text-sm text-foreground list-decimal list-inside">
              <li className="pl-1">
                <span className="font-semibold">Database schema not set up</span>{" "}
                <span className="text-muted-foreground block mt-1">
                  Run <code className="rounded bg-surface-2 px-1 text-xs">supabase/schema.sql</code> in Supabase SQL Editor
                </span>
              </li>
              <li className="pl-1">
                <span className="font-semibold">Environment variables missing</span>{" "}
                <span className="text-muted-foreground block mt-1">
                  Check <code className="rounded bg-surface-2 px-1 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-surface-2 px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
                </span>
              </li>
              <li className="pl-1">
                <span className="font-semibold">Supabase project paused</span>{" "}
                <span className="text-muted-foreground block mt-1">
                  Resume your project in Supabase dashboard
                </span>
              </li>
            </ol>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={handleRetry}
                className="text-xs"
              >
                Retry
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBackToLogin}
                className="text-xs"
              >
                Back to Login
              </Button>
            </div>
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

"use client";
/* eslint-disable react/no-unescaped-entities */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FacebookLogo,
  CheckCircle,
  WarningCircle,
  LinkSimple,
  LinkBreak,
  Key,
  Copy,
  Check,
  InstagramLogo,
  BookOpen,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ImageSourcePref } from "@/lib/types";
import { FutureSocialPlatforms } from "@/components/social/future-platforms";

const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Dhaka",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

interface SettingsState {
  facebook_connected: boolean;
  /** False when the deployment has no real Meta app credentials. */
  facebook_configured?: boolean;
  facebook_app_id: string | null;
  facebook_config_id: string | null;
  /** The secret itself never reaches the browser — only whether one is stored. */
  facebook_app_secret_set?: boolean;
  facebook_user_name: string | null;
  default_page_name: string | null;
  image_source: ImageSourcePref;
  utm_suffix: string;
  auto_post_enabled: boolean;
  posts_per_day: number;
  posting_hours: number[];
  timezone: string;
  topic_source?: "mine" | "trending" | "mixed";
  /** Instagram connection state */
  instagram_connected?: boolean;
  instagram_username?: string | null;
  /** Instagram App configuration */
  instagram_app_id: string | null;
  instagram_app_secret_set?: boolean;
  /** Autopilot destinations */
  autopilot_destinations?: ("facebook" | "instagram")[];
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <SettingsForm />
    </Suspense>
  );
}

function SettingsForm() {
  const params = useSearchParams();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [instagramDisconnecting, setInstagramDisconnecting] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [configId, setConfigId] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"uri" | "domain" | null>(null);
  // Read from the browser rather than configured, so they always match the
  // hostname the user is actually on — the values Facebook compares against.
  const [redirectUri, setRedirectUri] = useState("");
  const [appDomain, setAppDomain] = useState("");
  // Instagram configuration
  const [instagramAppId, setInstagramAppId] = useState("");
  const [instagramAppSecret, setInstagramAppSecret] = useState("");
  const [instagramRedirectUri, setInstagramRedirectUri] = useState("");
  const [savingInstagramCreds, setSavingInstagramCreds] = useState(false);
  const [instagramCredsError, setInstagramCredsError] = useState<string | null>(null);
  const [instagramConnecting, setInstagramConnecting] = useState(false);
  const [showInstagramGuide, setShowInstagramGuide] = useState(false);

  useEffect(() => {
    setRedirectUri(`${window.location.origin}/api/facebook/oauth/callback`);
    setAppDomain(window.location.hostname);
    setInstagramRedirectUri(`${window.location.origin}/api/instagram/oauth/callback`);
  }, []);

  const oauthStatus = params.get("facebook");
  const oauthMessage = params.get("message");
  const instagramSuccess = params.get("instagram_success");
  const urlInstagramError = params.get("instagram_error");

  useEffect(() => {
    fetch("/api/settings")
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || "Failed to load settings.");
        }
        const data = await r.json();
        setSettings(data);
        setAppId(data.facebook_app_id ?? "");
        setConfigId(data.facebook_config_id ?? "");
        setInstagramAppId(data.instagram_app_id ?? "");
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load settings."));
  }, []);

  // Handle Instagram OAuth callback
  useEffect(() => {
    if (instagramSuccess === "true") {
      setInstagramError(null);
      // Refresh settings to show connected state
      fetch("/api/settings")
        .then(async (r) => {
          if (!r.ok) {
            const text = await r.text();
            throw new Error(text || "Failed to load settings.");
          }
          const data = await r.json();
          setSettings((s) => (s ? { ...s, ...data } : s));
        })
        .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load settings."));
    }
    if (urlInstagramError) {
      setInstagramError(urlInstagramError);
    }
  }, [instagramSuccess, urlInstagramError]);

  async function saveCredentials() {
    setCredsError(null);
    if (!appId.trim()) {
      setCredsError("Enter the App ID from your Meta app.");
      return;
    }
    // An already-stored secret is left alone unless a new one is typed, so the
    // masked field does not have to round-trip the real value.
    if (!appSecret.trim() && !settings?.facebook_app_secret_set) {
      setCredsError("Enter the App Secret from App settings > Basic.");
      return;
    }

    setSavingCreds(true);
    try {
      const res = await fetch("/api/facebook/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appId.trim(),
          appSecret: appSecret.trim() || undefined,
          configId: configId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn&apos;t save those credentials.");

      setAppSecret("");
      setSettings((s) =>
        s
          ? {
              ...s,
              facebook_app_id: appId.trim(),
              facebook_config_id: configId.trim() || null,
              facebook_app_secret_set: true,
              facebook_configured: true,
            }
          : s
      );
    } catch (err) {
      setCredsError(err instanceof Error ? err.message : "Couldn&apos;t save those credentials.");
    } finally {
      setSavingCreds(false);
    }
  }

  async function saveInstagramCredentials() {
    setInstagramCredsError(null);
    if (!instagramAppId.trim()) {
      setInstagramCredsError("Enter the Instagram App ID from your Meta app.");
      return;
    }
    if (!instagramAppSecret.trim() && !settings?.instagram_app_secret_set) {
      setInstagramCredsError("Enter the Instagram App Secret from Instagram Business Login settings.");
      return;
    }

    setSavingInstagramCreds(true);
    try {
      const res = await fetch("/api/instagram/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: instagramAppId.trim(),
          appSecret: instagramAppSecret.trim() || undefined,
          redirectUri: instagramRedirectUri.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn&apos;t save Instagram credentials.");

      setInstagramAppSecret("");
      setSettings((s) =>
        s
          ? {
              ...s,
              instagram_app_id: instagramAppId.trim(),
              instagram_app_secret_set: true,
            }
          : s
      );
    } catch (err) {
      setInstagramCredsError(err instanceof Error ? err.message : "Couldn&apos;t save Instagram credentials.");
    } finally {
      setSavingInstagramCreds(false);
    }
  }

  async function copyValue(value: string, which: "uri" | "domain") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCredsError("Copying failed — select the field and copy manually.");
    }
  }

  async function save(patch: Partial<SettingsState>) {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings((s) => (s ? { ...s, ...data } : s));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function disconnect() {
    setDisconnecting(true);
    await fetch("/api/facebook/disconnect", { method: "POST" });
    setSettings((s) =>
      s ? { ...s, facebook_connected: false, facebook_user_name: null, default_page_name: null } : s
    );
    setDisconnecting(false);
  }

  async function connectInstagram() {
    setInstagramError(null);
    setInstagramConnecting(true);
    try {
      const res = await fetch("/api/instagram/auth");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start Instagram OAuth");

      // Redirect to Instagram OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      setInstagramError(err instanceof Error ? err.message : "Failed to start Instagram OAuth");
      setInstagramConnecting(false);
    }
  }

  async function disconnectInstagram() {
    setInstagramDisconnecting(true);
    setInstagramError(null);
    try {
      const res = await fetch("/api/instagram/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to disconnect Instagram");
      setSettings((s) =>
        s ? { ...s, instagram_connected: false, instagram_username: null } : s
      );
    } catch (err) {
      setInstagramError(err instanceof Error ? err.message : "Failed to disconnect Instagram");
    } finally {
      setInstagramDisconnecting(false);
    }
  }

  function toggleHour(hour: number) {
    if (!settings) return;
    const has = settings.posting_hours.includes(hour);
    const next = has ? settings.posting_hours.filter((h) => h !== hour) : [...settings.posting_hours, hour].sort((a, b) => a - b);
    setSettings({ ...settings, posting_hours: next });
    save({ posting_hours: next });
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {oauthStatus === "connected" && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-sm text-success">
          <CheckCircle size={18} /> Facebook account connected.
        </div>
      )}
      {oauthStatus === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <WarningCircle size={18} /> {oauthMessage ?? "Couldn&apos;t connect Facebook."}
        </div>
      )}

      {/* Facebook connection */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FacebookLogo size={22} weight="fill" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-foreground">Facebook account</h2>
              {settings.facebook_connected ? (
                <p className="mt-0.5 text-sm text-success">
                  Connected as {settings.facebook_user_name ?? "your account"}
                </p>
              ) : settings.facebook_configured === false ? (
                <p className="mt-0.5 max-w-md text-sm text-muted-foreground">
                  Add your Meta App ID and secret below to enable connecting.
                  Everything else works without them.
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">Not connected yet</p>
              )}
            </div>
          </div>
          {settings.facebook_connected ? (
            <Button size="sm" variant="secondary" onClick={disconnect} disabled={disconnecting}>
              <LinkBreak size={14} /> Disconnect
            </Button>
          ) : (
            // A plain anchor on purpose: this route answers with a redirect to
            // Facebook, which needs a full page navigation. <Link> would try to
            // route it client-side.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/api/facebook/oauth/start"
              aria-disabled={settings.facebook_configured === false}
              className={settings.facebook_configured === false ? "pointer-events-none" : undefined}
            >
              <Button size="sm" disabled={settings.facebook_configured === false}>
                <LinkSimple size={14} /> Connect
              </Button>
            </a>
          )}
        </div>
      </Card>

      {/* Instagram connection */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-purple-500">
              <InstagramLogo size={22} weight="fill" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-foreground">Instagram</h2>
              {settings.instagram_connected ? (
                <p className="mt-0.5 text-sm text-success">
                  Connected as @{settings.instagram_username ?? "your account"}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">Not connected yet</p>
              )}
            </div>
          </div>
          {settings.instagram_connected ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={disconnectInstagram}
              disabled={instagramDisconnecting}
            >
              <LinkBreak size={14} /> Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={connectInstagram}
              disabled={instagramConnecting || !settings.instagram_app_id}
            >
              <LinkSimple size={14} /> {instagramConnecting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>

        {!settings.instagram_connected && (
          <>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">Instagram App Configuration</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInstagramGuide(true)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  <BookOpen size={14} className="mr-1" />
                  Open Setup Guide
                </Button>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Add the Instagram product to your existing Meta app and configure Business Login for Instagram.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Instagram App ID</label>
                  <input
                    value={instagramAppId}
                    onChange={(e) => setInstagramAppId(e.target.value)}
                    placeholder="From Instagram Business Login settings"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Instagram App Secret</label>
                  <input
                    type="password"
                    value={instagramAppSecret}
                    onChange={(e) => setInstagramAppSecret(e.target.value)}
                    placeholder={
                      settings.instagram_app_secret_set ? "•••• saved — type to replace" : "From Instagram Business Login settings"
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Instagram Redirect URI — paste this into Instagram Business Login settings
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    value={instagramRedirectUri}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-xs text-muted-foreground outline-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => copyValue(instagramRedirectUri, "uri")}>
                    {copied === "uri" ? <Check size={14} /> : <Copy size={14} />}
                    {copied === "uri" ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              {instagramCredsError && <p className="mt-2 text-xs text-destructive">{instagramCredsError}</p>}

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" onClick={saveInstagramCredentials} disabled={savingInstagramCreds}>
                  {savingInstagramCreds ? "Saving..." : "Save Instagram Configuration"}
                </Button>
                {settings.instagram_app_id && (
                  <span className="text-xs font-medium text-success">Instagram configured</span>
                )}
              </div>
            </div>
          </>
        )}

        {instagramError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <WarningCircle size={14} /> {instagramError}
          </div>
        )}
      </Card>

      {/* Meta app credentials */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
            <Key size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-foreground">Meta app</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Create one at{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                developers.facebook.com/apps
              </a>{" "}
              with the <strong>&ldquo;Manage everything on your Page&rdquo;</strong> use case — not
              the Facebook Login one, which Meta treats as incompatible with Page
              management. Posting to a Page you administer needs no App Review.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">App ID</label>
                <input
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1234567890123456"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">App Secret</label>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder={
                    settings.facebook_app_secret_set ? "•••• saved — type to replace" : "from App settings > Basic"
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Login configuration ID
              </label>
              <input
                value={configId}
                onChange={(e) => setConfigId(e.target.value)}
                placeholder="required if your app uses Facebook Login for Business"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Apps created with the &ldquo;Manage everything on your Page&rdquo; use case use
                Facebook Login for Business, where this replaces the permission list.
                Find it under <strong>Facebook Login for Business → Configurations</strong>.
                Leave blank for classic Facebook Login.
              </p>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Redirect URI — paste this into your Meta app&apos;s login settings, under Valid OAuth Redirect URIs
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={redirectUri}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-xs text-muted-foreground outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => copyValue(redirectUri, "uri")}>
                  {copied === "uri" ? <Check size={14} /> : <Copy size={14} />}
                  {copied === "uri" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                App Domain — paste this into App settings &gt; Basic &gt; App Domains
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={appDomain}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-xs text-muted-foreground outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => copyValue(appDomain, "domain")}>
                  {copied === "domain" ? <Check size={14} /> : <Copy size={14} />}
                  {copied === "domain" ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Without this, Facebook refuses the login with
                &quot;Can&apos;t load URL: the domain of this URL isn&apos;t included in the
                app&apos;s domains&quot;. No <code className="rounded bg-surface-2 px-1 text-[11px]">https://</code>,
                no trailing slash.
              </p>
            </div>

            {credsError && <p className="mt-2 text-xs text-destructive">{credsError}</p>}

            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={saveCredentials} disabled={savingCreds}>
                {savingCreds ? "Saving…" : "Save credentials"}
              </Button>
              {settings.facebook_configured && (
                <span className="text-xs font-medium text-success">Credentials stored</span>
              )}
            </div>

            {/* Once the App ID is known these can be built for this exact app,
                which saves hunting through the Meta dashboard for the three
                screens this setup touches. */}
            {settings.facebook_app_id && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Open in your Meta app
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {[
                    {
                      label: "Basic settings — App Domains",
                      href: `https://developers.facebook.com/apps/${settings.facebook_app_id}/settings/basic/`,
                    },
                    {
                      label: "Use cases — add permissions",
                      href: `https://developers.facebook.com/apps/${settings.facebook_app_id}/use_cases/`,
                    },
                    {
                      label: "Login settings — Redirect URIs",
                      href: `https://developers.facebook.com/apps/${settings.facebook_app_id}/fb-login/settings/`,
                    },
                    {
                      label: "Login configurations",
                      href: `https://developers.facebook.com/apps/${settings.facebook_app_id}/fb-login/configurations/`,
                    },
                    {
                      label: "App dashboard",
                      href: `https://developers.facebook.com/apps/${settings.facebook_app_id}/`,
                    },
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Future social platforms */}
      <FutureSocialPlatforms />

      {/* Instagram Setup Guide Modal */}
      {showInstagramGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-heading font-bold text-foreground text-lg">Instagram Developer App Setup Guide</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInstagramGuide(false)}
              >
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Overview</p>
                <p className="text-muted-foreground">
                  This guide walks you through creating and configuring a Meta Developer App for FeedWren&apos;s Instagram integration.
                  FeedWren uses the <strong>Instagram API with Instagram Login</strong> architecture, which allows direct Instagram authorization without requiring a Facebook Page.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Important:</strong> Facebook and Instagram are separate FeedWren integrations. Instagram does NOT depend on Facebook Pages.
                </p>
              </div>

              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">What You Need</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Meta Developer account (free at developers.facebook.com)</li>
                  <li>Instagram Professional account (Business or Creator type)</li>
                  <li>About 15-20 minutes</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 1: Log Into Meta for Developers</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com</a></p>
                  <p><strong>CLICK:</strong> &ldquo;Log In&rdquo; in top-right corner</p>
                  <p><strong>WHY:</strong> You must be logged into a Meta Developer account to create apps.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 2: Create a New Meta App</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> <a href="https://developers.facebook.com/apps/creation/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com/apps/creation/</a></p>
                  <p><strong>CLICK:</strong> &ldquo;My Apps&rdquo; or go directly to the creation URL</p>
                  <p><strong>ENTER:</strong> App Name (e.g., &ldquo;FeedWren Instagram Integration&rdquo;)</p>
                  <p><strong>ENTER:</strong> Contact Email (use an email you check regularly)</p>
                  <p><strong>CLICK:</strong> &ldquo;Next&rdquo;</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 3: Select Use Cases</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> Use Cases screen (appears after entering app details)</p>
                  <p><strong>SELECT:</strong> &ldquo;Other&rdquo; (at the bottom of the list)</p>
                  <p><strong>CLICK:</strong> &ldquo;Next&rdquo;</p>
                  <p><strong>WHY:</strong> FeedWren uses Instagram API which doesn&apos;t fit standard use case categories.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 4: Select App Type</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> App Type selection screen</p>
                  <p><strong>SELECT:</strong> &ldquo;Business&rdquo;</p>
                  <p><strong>DO NOT SELECT:</strong> &ldquo;Consumer&rdquo; — Instagram product is NOT available for Consumer apps</p>
                  <p><strong>CLICK:</strong> &ldquo;Next&rdquo;</p>
                  <p><strong>WHY:</strong> Instagram API requires a Business-type app.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 5: Connect Business Portfolio</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> Connect a Business screen</p>
                  <p><strong>SELECT:</strong> &ldquo;I don&apos;t want to connect a business portfolio yet&rdquo;</p>
                  <p><strong>CLICK:</strong> &ldquo;Next&rdquo;</p>
                  <p><strong>WHY:</strong> Business Portfolio is only required for production with external users. You can add it later.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 6: Review and Create App</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> Final review screen</p>
                  <p><strong>VERIFY:</strong> App Name, Email, Use Case (Other), App Type (Business)</p>
                  <p><strong>CLICK:</strong> &ldquo;Create App&rdquo;</p>
                  <p><strong>WHY:</strong> This creates your app in Development Mode.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 7: Add Instagram Product</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> App Dashboard → Left sidebar → &ldquo;Add Product&rdquo;</p>
                  <p><strong>CLICK:</strong> &ldquo;Instagram&rdquo;</p>
                  <p><strong>DO NOT SELECT:</strong> &ldquo;Facebook Login&rdquo; or &ldquo;Facebook Login for Business&rdquo;</p>
                  <p><strong>WHY:</strong> FeedWren uses Instagram API with Instagram Login, not Facebook Login.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 8: Configure Instagram Business Login</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> Instagram → API setup with Instagram login</p>
                  <p><strong>CLICK:</strong> &ldquo;Set up&rdquo; under &ldquo;Set up Instagram business login&rdquo;</p>
                  <p><strong>ENTER REDIRECT URI:</strong> {instagramRedirectUri}</p>
                  <p><strong>CLICK:</strong> &ldquo;Save&rdquo;</p>
                  <p><strong>WHY:</strong> This is where Meta redirects users after OAuth authorization.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 9: Verify OAuth Redirect URIs</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> Instagram → Business login settings</p>
                  <p><strong>CLICK:</strong> &ldquo;Business login settings&rdquo;</p>
                  <p><strong>VERIFY:</strong> Your Redirect URI appears in OAuth Redirect URIs list</p>
                  <p><strong>WHY:</strong> OAuth Redirect URIs must be pre-registered in Meta.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 10: Configure Permissions</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> App Review → Permissions and Features</p>
                  <p><strong>ADD:</strong> &ldquo;instagram_business_basic&rdquo;</p>
                  <p><strong>ADD:</strong> &ldquo;instagram_business_content_publish&rdquo;</p>
                  <p><strong>CLICK:</strong> &ldquo;Get Standard Access&rdquo; for each</p>
                  <p><strong>DO NOT USE:</strong> &ldquo;instagram_basic&rdquo; or &ldquo;instagram_content_publish&rdquo; (deprecated Jan 27, 2025)</p>
                  <p><strong>WHY:</strong> These are the current permission names for Instagram API with Instagram Login.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 11: Find Your App ID</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> Instagram → API setup with Instagram login OR App Settings → Basic</p>
                  <p><strong>LOOK FOR:</strong> App ID field</p>
                  <p><strong>COPY:</strong> The numeric App ID value</p>
                  <p><strong>WHY:</strong> FeedWren needs this for OAuth authentication.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 12: Find Your App Secret</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> App Settings → Basic</p>
                  <p><strong>CLICK:</strong> &ldquo;Show&rdquo; or &ldquo;Reveal&rdquo; next to App Secret</p>
                  <p><strong>COPY:</strong> The App Secret value</p>
                  <p><strong>SECURITY:</strong> Never share this publicly or commit to Git</p>
                  <p><strong>WHY:</strong> FeedWren needs this to exchange authorization codes for access tokens.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 13: Configure FeedWren</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> FeedWren Settings → Social Connect → Instagram</p>
                  <p><strong>PASTE:</strong> App ID from Meta</p>
                  <p><strong>PASTE:</strong> App Secret from Meta</p>
                  <p><strong>CLICK:</strong> &ldquo;Save Instagram Configuration&rdquo;</p>
                  <p><strong>WHY:</strong> FeedWren stores these credentials securely for OAuth.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 14: Connect Your Instagram Account</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> FeedWren Settings → Social Connect → Instagram</p>
                  <p><strong>CLICK:</strong> &ldquo;Connect Instagram&rdquo;</p>
                  <p><strong>AUTHORIZE:</strong> Allow FeedWren to access your Instagram account</p>
                  <p><strong>WHY:</strong> This is the OAuth flow where you grant FeedWren permission.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-3">STEP 15: Verify Connection</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>WHERE:</strong> FeedWren Settings → Social Connect → Instagram</p>
                  <p><strong>CHECK:</strong> Instagram username displayed</p>
                  <p><strong>CHECK:</strong> Status shows &ldquo;Connected&rdquo;</p>
                  <p><strong>WHY:</strong> Confirms OAuth flow completed successfully.</p>
                </div>
              </div>

              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Account Requirements</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Required:</strong> Instagram Professional — Business account</li>
                  <li><strong>Required:</strong> Instagram Professional — Creator account</li>
                  <li><strong>Not Supported:</strong> Personal Instagram account</li>
                  <li><strong>How to Convert:</strong> Instagram Settings → Account → Switch to Professional Account</li>
                </ul>
              </div>

              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Facebook Dependency</p>
                <p className="text-muted-foreground">
                  <strong>Facebook Page Required:</strong> NO<br />
                  <strong>Facebook Login Required:</strong> NO<br />
                  <strong>Why:</strong> FeedWren uses Instagram API with Instagram Login. This architecture explicitly states that a Facebook Page is NOT required. Instagram authorization is direct through Instagram credentials.
                </p>
              </div>

              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Development Mode vs Production</p>
                <p className="text-muted-foreground">
                  <strong>Development Mode:</strong> You and test users can connect. External users cannot.<br />
                  <strong>Production (Live Mode):</strong> Requires App Review and Business Verification. External users can connect.<br />
                  <strong>Advanced Access:</strong> Required for publishing to Instagram for external users.
                </p>
              </div>

              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Troubleshooting</p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>&ldquo;I cannot find User Access&rdquo;</strong></p>
                  <p className="text-xs">User Access is no longer a separate selection. Configure access through Instagram product settings.</p>
                  
                  <p><strong>&ldquo;I don&apos;t know which App Type to choose&rdquo;</strong></p>
                  <p className="text-xs">Choose &ldquo;Business&rdquo; app type. Consumer apps cannot add the Instagram product.</p>
                  
                  <p><strong>&ldquo;I cannot find Instagram&rdquo;</strong></p>
                  <p className="text-xs">Click &ldquo;Add Product&rdquo; in App Dashboard, then search for &ldquo;Instagram&rdquo;. Ensure your app is Business type.</p>
                  
                  <p><strong>&ldquo;OAuth redirect URI is invalid&rdquo;</strong></p>
                  <p className="text-xs">Ensure Redirect URI matches exactly in Meta App (no trailing slash, correct protocol and path).</p>
                  
                  <p><strong>&ldquo;Instagram account not eligible&rdquo;</strong></p>
                  <p className="text-xs">Your Instagram account must be Professional (Business or Creator). Personal accounts are not supported.</p>
                </div>
              </div>

              <div className="bg-surface-2 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Official Meta Documentation</p>
                <ul className="text-muted-foreground space-y-1">
                  <li><a href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram API with Instagram Login</a></li>
                  <li><a href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Business Login for Instagram</a></li>
                  <li><a href="https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create a Meta app for Instagram</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation preferences */}
      <Card>
        <h2 className="font-heading font-bold text-foreground">Generation preferences</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every source here is free — no paid API keys required.
        </p>

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground">Default image source</label>
          <select
            value={settings.image_source}
            onChange={(e) => {
              const v = e.target.value as ImageSourcePref;
              setSettings({ ...settings, image_source: v });
              save({ image_source: v });
            }}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary sm:w-64"
          >
            <option value="ai">AI-generated image</option>
            <option value="stock">Free stock photo</option>
            <option value="mixed">Mix of both</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground">
            Text appended to every post (optional, e.g. a UTM link or sign-off)
          </label>
          <input
            value={settings.utm_suffix}
            onChange={(e) => setSettings({ ...settings, utm_suffix: e.target.value })}
            onBlur={(e) => save({ utm_suffix: e.target.value })}
            placeholder="via mysite.com"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      {/* Autopilot */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-foreground">Autopilot</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Let the bot pick a topic and post on its own, with no one clicking anything.
            </p>
            <p className="mt-1.5 text-sm text-foreground">
              Writing about:{" "}
              <span className="font-semibold">
                {settings.topic_source === "trending"
                  ? "trending ideas"
                  : settings.topic_source === "mixed"
                    ? "a mix of your topics and trending ideas"
                    : "your topics"}
              </span>{" "}
              ·{" "}
              <Link href="/dashboard/topics" className="font-medium text-primary hover:underline">
                Manage topics
              </Link>
            </p>
          </div>
          <button
            onClick={() => {
              const next = !settings.auto_post_enabled;
              setSettings({ ...settings, auto_post_enabled: next });
              save({ auto_post_enabled: next });
            }}
            aria-label="Toggle autopilot"
            className={cn(
              "relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition",
              settings.auto_post_enabled ? "bg-primary" : "bg-surface-2"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
                settings.auto_post_enabled ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>

        {!settings.default_page_name && (
          <p className="mt-3 text-xs text-warning">
            Set a default Page on the Pages screen — autopilot needs one to post to.
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Posts per day</label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.posts_per_day}
              onChange={(e) => setSettings({ ...settings, posts_per_day: Number(e.target.value) })}
              onBlur={(e) => save({ posts_per_day: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => {
                setSettings({ ...settings, timezone: e.target.value });
                save({ timezone: e.target.value });
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground">
            Allowed posting hours (local time)
          </label>
          <div className="mt-1.5 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {Array.from({ length: 24 }, (_, h) => h).map((h) => (
              <button
                key={h}
                onClick={() => toggleHour(h)}
                className={cn(
                  "cursor-pointer rounded-lg py-1.5 text-xs font-medium transition",
                  settings.posting_hours.includes(h)
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground hover:bg-border"
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground">Autopilot publishing destinations</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const current: ("facebook" | "instagram")[] = (settings.autopilot_destinations || ["facebook"]) as ("facebook" | "instagram")[];
                const newDestinations: ("facebook" | "instagram")[] = current.includes("facebook")
                  ? current.filter((d) => d !== "facebook")
                  : [...current, "facebook"];
                setSettings({ ...settings, autopilot_destinations: newDestinations });
                save({ autopilot_destinations: newDestinations });
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                (settings.autopilot_destinations || ["facebook"]).includes("facebook")
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-border/50"
              }`}
            >
              <FacebookLogo size={16} weight="fill" />
              Facebook
              {(settings.autopilot_destinations || ["facebook"]).includes("facebook") && <CheckCircle size={14} />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!settings.instagram_connected) {
                  return;
                }
                const current: ("facebook" | "instagram")[] = (settings.autopilot_destinations || ["facebook"]) as ("facebook" | "instagram")[];
                const newDestinations: ("facebook" | "instagram")[] = current.includes("instagram")
                  ? current.filter((d) => d !== "instagram")
                  : [...current, "instagram"];
                setSettings({ ...settings, autopilot_destinations: newDestinations });
                save({ autopilot_destinations: newDestinations });
              }}
              disabled={!settings.instagram_connected}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                (settings.autopilot_destinations || ["facebook"]).includes("instagram")
                  ? "border-purple-500 bg-purple-500/10 text-purple-500"
                  : !settings.instagram_connected
                  ? "border-dashed border-border bg-surface-2 text-muted-foreground cursor-not-allowed opacity-50"
                  : "border-border bg-background text-muted-foreground hover:border-border/50"
              }`}
            >
              <InstagramLogo size={16} weight="fill" />
              Instagram
              {(settings.autopilot_destinations || ["facebook"]).includes("instagram") && <CheckCircle size={14} />}
            </button>
          </div>
          {!settings.instagram_connected && (
            <p className="mt-1 text-xs text-muted-foreground">
              Connect Instagram to enable autopilot Instagram publishing.
            </p>
          )}
        </div>
      </Card>

      <div className="h-4 text-right text-xs text-muted-foreground">
        {saving ? "Saving…" : saved ? "Saved ✓" : ""}
      </div>
    </div>
  );
}

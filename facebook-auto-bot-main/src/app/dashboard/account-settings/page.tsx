"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  X,
  Upload,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/theme-provider";
import { getDatabaseErrorMessage, logError } from "@/lib/errors";
import { processAvatarImage, getUserInitials } from "@/lib/image-utils";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";

export default function AccountSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    website: "",
    timezone: "Asia/Dhaka",
    avatar_url: "" as string | null,
  });

  const [avatarState, setAvatarState] = useState({
    uploading: false,
    preview: null as string | null,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    passwordLastChanged: "30 days ago",
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [subscription, setSubscription] = useState({
    plan: "Free Tier",
    status: "Active",
    nextBilling: null,
    postsThisMonth: 15,
    postsLimit: 50,
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
  });

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/settings");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load settings");
      }
      const data: Record<string, unknown> = await res.json();

      setProfile({
        name: (data.display_name as string) || "",
        username: (data.username as string) || "",
        email: user?.email || "",
        bio: (data.bio as string) || "",
        website: (data.website as string) || "",
        timezone: (data.timezone as string) || "Asia/Dhaka",
        avatar_url: (data.avatar_url as string) || null,
      });

      setAvatarState({
        uploading: false,
        preview: (data.avatar_url as string) || null,
      });

      setSecurity({
        twoFactorEnabled: (data.two_factor_enabled as boolean) || false,
        loginNotifications: (data.email_notifications as boolean) || true,
        passwordLastChanged: "30 days ago",
      });

      setPreferences({
        emailNotifications: (data.email_notifications as boolean) !== false,
        pushNotifications: (data.push_notifications as boolean) || false,
        weeklyReports: (data.weekly_reports as boolean) !== false,
      });

      // Set theme from database
      if (data.theme) {
        setTheme(data.theme as "light" | "dark" | "system");
      }

      // Load post count for subscription
      const postsRes = await fetch("/api/posts");
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const posts = Array.isArray(postsData) ? postsData : (postsData.posts || []);
        const thisMonth = new Date().toISOString().slice(0, 7);
        const postsThisMonth = posts.filter(
          (p: { created_at?: string }) => p.created_at?.startsWith(thisMonth)
        ).length;
        setSubscription(prev => ({
          ...prev,
          postsThisMonth,
        }));
      }
    } catch (err) {
      logError("AccountSettings", err);
      const errorObj = err && typeof err === 'object' && 'message' in err ? err as { message?: string; code?: string } : null;
      setError(getDatabaseErrorMessage(errorObj));
    } finally {
      setLoading(false);
    }
  }

  // Load settings from database on mount
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.name,
          username: profile.username,
          bio: profile.bio,
          website: profile.website,
          timezone: profile.timezone,
          theme: theme,
          email_notifications: preferences.emailNotifications,
          push_notifications: preferences.pushNotifications,
          weekly_reports: preferences.weeklyReports,
          two_factor_enabled: security.twoFactorEnabled,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      logError("AccountSettings Save", err);
      const errorObj = err && typeof err === 'object' && 'message' in err ? err as { message?: string; code?: string } : null;
      setError(getDatabaseErrorMessage(errorObj));
    } finally {
      setSaving(false);
    }
  }

  // Auto-save on preference changes (debounced)
  useEffect(() => {
    if (loading) return; // Don't auto-save on initial load
    const timer = setTimeout(() => {
      if (!saving) {
        handleSave();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [preferences, security.twoFactorEnabled, loading, theme]);

  async function handleAvatarUpload(file: File) {
    if (!user) {
      setError("You must be logged in to upload an avatar");
      return;
    }

    setAvatarState({ ...avatarState, uploading: true });
    setError(null);

    try {
      // Process image (resize, compress)
      const processed = await processAvatarImage(file);

      // Upload to Supabase Storage
      const supabase = supabaseClient();
      const fileName = `avatar.webp`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = new URL(profile.avatar_url).pathname.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processed.blob, {
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update database
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!res.ok) {
        // Rollback: delete uploaded file
        await supabase.storage.from('avatars').remove([filePath]);
        throw new Error("Failed to update profile");
      }

      // Update local state
      setProfile({ ...profile, avatar_url: publicUrl });
      setAvatarState({ uploading: false, preview: publicUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      logError("Avatar Upload", err);
      const errorObj = err && typeof err === 'object' && 'message' in err ? err as { message?: string; code?: string } : null;
      setError(getDatabaseErrorMessage(errorObj) || "Failed to upload avatar");
      setAvatarState({ ...avatarState, uploading: false });
    }
  }

  async function handleAvatarRemove() {
    if (!user || !profile.avatar_url) return;

    setAvatarState({ ...avatarState, uploading: true });
    setError(null);

    try {
      const supabase = supabaseClient();

      // Delete from storage
      const oldPath = new URL(profile.avatar_url).pathname.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
      }

      // Update database
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: null }),
      });

      if (!res.ok) {
        throw new Error("Failed to remove avatar");
      }

      // Update local state
      setProfile({ ...profile, avatar_url: null });
      setAvatarState({ uploading: false, preview: null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      logError("Avatar Remove", err);
      const errorObj = err && typeof err === 'object' && 'message' in err ? err as { message?: string; code?: string } : null;
      setError(getDatabaseErrorMessage(errorObj) || "Failed to remove avatar");
      setAvatarState({ ...avatarState, uploading: false });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    handleAvatarUpload(file);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="mb-4">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
        </div>
        <div className="space-y-1 px-4 py-2">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4 py-3">
            <div
              className="relative h-20 w-20 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarState.preview ? (
                <img
                  src={avatarState.preview}
                  alt="Profile avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                  {getUserInitials(profile.name)}
                </div>
              )}
              {avatarState.uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              {!avatarState.uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={20} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{profile.name || "Your Name"}</h3>
              <p className="text-sm text-muted-foreground">{profile.username ? `@${profile.username}` : "@username"}</p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={avatarState.uploading}
              />
              {avatarState.preview && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarRemove();
                  }}
                  disabled={avatarState.uploading}
                >
                  <X size={16} className="mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Email Display Card */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted-foreground">
              {profile.email}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your email address is managed by your sign-in provider and cannot be changed here.
            </p>
          </div>

          {/* Name Field */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              placeholder="Your name"
            />
          </div>

          {/* Username Field */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              placeholder="@username"
            />
          </div>

          {/* Bio Field */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
              placeholder="Tell us about yourself"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {profile.bio.length} / 150
            </p>
          </div>

          {/* Website Field */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Timezone Field */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              <option value="Asia/Dhaka">Asia/Dhaka</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Karachi">Asia/Karachi</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Security Card */}
      <Card className="mb-4">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Security</h2>
        </div>
        <div className="space-y-1 px-4 py-2">
          {/* Two-Factor Auth */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Two-Factor Authentication</h3>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                security.twoFactorEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  security.twoFactorEnabled ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Login Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Login Notifications</h3>
              <p className="text-xs text-muted-foreground">Get notified of login attempts</p>
            </div>
            <button
              onClick={() => setSecurity({ ...security, loginNotifications: !security.loginNotifications })}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                security.loginNotifications ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  security.loginNotifications ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Password</h3>
              <p className="text-xs text-muted-foreground">Last changed {security.passwordLastChanged}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowPasswordDialog(true)}>
              Change
            </Button>
          </div>
        </div>
      </Card>

      {/* Password Reset Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                    setPasswordError("All fields are required");
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setPasswordError("Passwords do not match");
                    return;
                  }
                  if (passwordForm.newPassword.length < 8) {
                    setPasswordError("Password must be at least 8 characters");
                    return;
                  }
                  setPasswordError(null);
                  // Simulate password change
                  setSecurity({ ...security, passwordLastChanged: "Just now" });
                  setShowPasswordDialog(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Card */}
      <Card className="mb-4">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Subscription</h2>
        </div>
        <div className="space-y-1 px-4 py-2">
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{subscription.plan}</h3>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    {subscription.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription.postsThisMonth} / {subscription.postsLimit} posts this month
                </p>
              </div>
              <Button size="sm">Upgrade</Button>
            </div>
          </div>

          <div className="py-3">
            <h3 className="text-sm font-medium text-foreground mb-2">Usage</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Posts Generated</span>
                <span className="font-medium text-foreground">{subscription.postsThisMonth}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{
                    width: `${(subscription.postsThisMonth / subscription.postsLimit) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Limit</span>
                <span className="font-medium text-foreground">{subscription.postsLimit}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences Card */}
      <Card className="mb-4">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
        </div>
        <div className="space-y-1 px-4 py-2">
          {/* Theme Selection */}
          <div className="py-3">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Email Notifications</h3>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                preferences.emailNotifications ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  preferences.emailNotifications ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Push Notifications</h3>
              <p className="text-xs text-muted-foreground">Receive in-app notifications</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, pushNotifications: !preferences.pushNotifications })}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                preferences.pushNotifications ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  preferences.pushNotifications ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Weekly Reports */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Weekly Reports</h3>
              <p className="text-xs text-muted-foreground">Get weekly performance summaries</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, weeklyReports: !preferences.weeklyReports })}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                preferences.weeklyReports ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  preferences.weeklyReports ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Danger Zone</h2>
        </div>
        <div className="space-y-1 px-4 py-2">
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Delete Account</h3>
              <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Button size="sm" variant="danger">
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle size={16} />
            Saved
          </div>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

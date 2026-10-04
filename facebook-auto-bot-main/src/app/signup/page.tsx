"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    console.log("=== FORM SUBMIT STARTED ===");
    console.log("Email:", email);
    console.log("Password length:", password.length);

    setLoading(true);
    setError(null);

    // Basic validation
    if (!email || !email.includes("@") || !email.includes(".")) {
      console.log("Email validation failed");
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      console.log("Email validation failed");
      setError("Password must be at least 4 characters.");
      setLoading(false);
      return;
    }

    console.log("Validation passed, starting Supabase signup...");
    try {
      const supabase = supabaseClient();
      console.log("Supabase client created");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Signup API response:", { data, signUpError });

      if (signUpError) {
        console.error("Supabase signup error:", signUpError);
        throw signUpError;
      }

      // After successful signup
      if (data.user) {
        console.log("User created successfully:", data.user.id);

        // Create default settings for the user using a server-side API call
        // This is needed because RLS might block client-side inserts
        console.log("Creating default settings via API...");
        try {
          const settingsRes = await fetch('/api/create-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id }),
          });

          if (settingsRes.ok) {
            console.log("Default settings created");
          } else {
            console.error("Failed to create settings:", await settingsRes.text());
            // Don't block signup if settings fail
          }
        } catch (settingsErr) {
          console.error("Settings creation error:", settingsErr);
          // Don't block signup
        }

        // If email confirmation is disabled, user is automatically signed in
        if (data.session) {
          console.log("Session exists, redirecting to dashboard");
          router.push("/dashboard");
          router.refresh();
        } else {
          // Email confirmation required
          console.log("Email confirmation required");
          setSuccess(true);
        }
      } else {
        console.error("No user data returned from signup");
        setError("Failed to create user. Please try again.");
      }
    } catch (err) {
      console.error("=== SIGNUP ERROR ===", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }

    console.log("=== FORM SUBMIT ENDED ===");
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent 70%)" }}
        />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="rounded-card border border-border bg-surface p-8 shadow-xl shadow-black/5 text-center">
            <h1 className="font-heading text-xl font-bold text-foreground">Check your email</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              We've sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-card border border-border bg-surface p-8 shadow-xl shadow-black/5"
        >
          <h1 className="font-heading text-xl font-bold text-foreground">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up to start automating your Facebook posts.
          </p>

          <label className="mt-6 block text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="you@example.com"
          />

          <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-muted-foreground">Minimum 4 characters</p>

          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => console.log("Button clicked")}
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(params.get("message"));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    console.log("=== LOGIN FORM SUBMIT STARTED ===");
    console.log("Email:", email);
    console.log("Password length:", password.length);

    setLoading(true);
    setError(null);
    setMessage(null);

    // Basic validation
    if (!email || !email.includes("@") || !email.includes(".")) {
      console.log("Email validation failed");
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    console.log("Validation passed, starting Supabase login...");
    try {
      const supabase = supabaseClient();
      console.log("Supabase client created");

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login API response:", { data, signInError });

      if (signInError) {
        console.error("Supabase login error:", signInError);
        throw signInError;
      }

      console.log("Login successful, session:", data.session);
      console.log("Redirecting to:", params.get("next") || "/dashboard");

      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      console.error("=== LOGIN ERROR ===", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }

    console.log("=== LOGIN FORM SUBMIT ENDED ===");
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
          <h1 className="font-heading text-xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your dashboard.
          </p>

          {message && (
            <p className="mt-4 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="••••••••"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

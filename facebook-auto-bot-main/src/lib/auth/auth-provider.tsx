"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { logError } from "@/lib/errors";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Authentication states
 */
export type AuthState =
  | "INITIALIZING" // Auth is being loaded/restored
  | "AUTHENTICATED" // User is logged in
  | "UNAUTHENTICATED" // User is logged out
  | "ERROR"; // Auth error occurred

interface AuthContextType {
  authState: AuthState;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initial session check - NO artificial timeout
    // We wait for the actual session check to complete
    async function loadInitialSession() {
      try {
        const supabase = supabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          logError("AuthProvider initial session check", error);
          setAuthState("UNAUTHENTICATED");
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          setAuthState("AUTHENTICATED");
        } else {
          setUser(null);
          setSession(null);
          setAuthState("UNAUTHENTICATED");
        }
      } catch (err) {
        if (mounted) {
          logError("AuthProvider initial session error", err);
          setAuthState("UNAUTHENTICATED");
        }
      }
    }

    loadInitialSession();

    // Listen for auth state changes
    const supabase = supabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        if (!mounted) return;

        console.log("[AuthProvider] Auth state change:", event, session?.user?.email);

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            setUser(session?.user ?? null);
            setSession(session);
            setAuthState("AUTHENTICATED");
            break;

          case "SIGNED_OUT":
            setUser(null);
            setSession(null);
            setAuthState("UNAUTHENTICATED");
            break;

          case "INITIAL_SESSION":
            // Handled by initial load
            break;

          default:
            // For other events, update state based on session
            if (session?.user) {
              setUser(session.user);
              setSession(session);
              setAuthState("AUTHENTICATED");
            } else {
              setUser(null);
              setSession(null);
              setAuthState("UNAUTHENTICATED");
            }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = supabaseClient();
      await supabase.auth.signOut();
      // State will be updated by onAuthStateChange listener
    } catch (err) {
      logError("AuthProvider signOut", err);
      // Force logout even if signOut fails
      setUser(null);
      setSession(null);
      setAuthState("UNAUTHENTICATED");
    }
  };

  const value: AuthContextType = {
    authState,
    user,
    session,
    isLoading: authState === "INITIALIZING",
    isAuthenticated: authState === "AUTHENTICATED",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth state
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user is authenticated
 * Returns false during initialization to prevent premature redirects
 */
export function useIsAuthenticated() {
  const { authState } = useAuth();
  return authState === "AUTHENTICATED";
}

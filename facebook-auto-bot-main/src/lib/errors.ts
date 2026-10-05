/**
 * Centralized error handling utilities
 */

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "SupabaseError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Get user-friendly error message from Supabase auth error
 */
export function getAuthErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return "An unknown error occurred.";

  const message = error.message || String(error);

  // Auth-specific errors
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (message.includes("Email not confirmed")) {
    return "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
  }

  if (message.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (message.includes("Password should be")) {
    return "Password is too weak. Please use a stronger password with at least 6 characters, including uppercase and lowercase letters, and numbers.";
  }

  if (message.includes("Invalid email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("Too many requests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (message.includes("Email rate limit exceeded")) {
    return "Too many sign-up attempts from this email. Please try again later.";
  }

  if (message.includes("Signup not allowed")) {
    return "Sign-up is currently disabled. Please contact support.";
  }

  // Default fallback
  return message || "An unexpected error occurred. Please try again.";
}

/**
 * Get user-friendly error message from database error
 */
export function getDatabaseErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return "A database error occurred.";

  const message = error.message || String(error);
  const code = error.code;

  // RLS policy errors
  if (message.includes("permission denied") || message.includes("access denied")) {
    return "You don't have permission to perform this action.";
  }

  // Connection errors
  if (message.includes("connection") || message.includes("timeout")) {
    return "Unable to connect to the database. Please check your internet connection.";
  }

  // Schema errors
  if (message.includes("relation") && message.includes("does not exist")) {
    return "Database not set up. Please run the schema.sql file in Supabase SQL Editor.";
  }

  // Constraint errors
  if (code === "23505") {
    return "This record already exists.";
  }

  if (code === "23503") {
    return "Referenced record not found.";
  }

  if (code === "23502") {
    return "Required field is missing.";
  }

  // Default fallback
  return message || "A database error occurred. Please try again.";
}

/**
 * Log error with context
 */
export function logError(context: string, error: unknown, additionalInfo?: unknown) {
  console.error(`[${context}] Error:`, error);
  if (additionalInfo) {
    console.error(`[${context}] Additional info:`, additionalInfo);
  }
}

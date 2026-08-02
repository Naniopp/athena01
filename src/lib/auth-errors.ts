/** Friendly, actionable copy for Supabase auth errors. */
export function friendlyAuthError(raw: string): string {
  const m = raw.toLowerCase();

  if (m.includes("invalid login")) {
    return "Incorrect email or password. If you signed up with Google or an email code, use that method instead.";
  }
  if (m.includes("not confirmed")) {
    return "Your email isn't verified yet. Use “Sign in with email code” to verify and get in.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead, or reset your password.";
  }
  if (m.includes("password should be") || m.includes("password is too short")) {
    return "Password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  }
  if (m.includes("pwned") || m.includes("compromised")) {
    return "This password has appeared in a data breach. Please choose a different one.";
  }
  if (m.includes("expired")) {
    return "That code or link has expired. Request a new one and try again.";
  }
  if (m.includes("token") && m.includes("invalid")) {
    return "That code is incorrect. Double-check the 6 digits or request a new code.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute before trying again.";
  }
  if (m.includes("user not found")) {
    return "We couldn't find an account with that email. Create one to get started.";
  }
  if (m.includes("same password") || m.includes("should be different")) {
    return "Your new password must be different from your current one.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Network problem — check your connection and try again.";
  }
  if (m.includes("unsupported provider")) {
    return "That sign-in method isn't enabled yet. Please use email instead.";
  }
  return raw || "Something went wrong. Please try again.";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Current path + search, used as the `next` param so we return here after login. */
export function currentNext(): string {
  if (typeof window === "undefined") return "/dashboard/student";
  return window.location.pathname + window.location.search;
}

/**
 * Sign out of every device (revokes all refresh tokens for the user),
 * then shows a confirmation toast. Falls back to a local sign-out if the
 * global revoke fails (e.g. offline) so the device never stays signed in.
 */
export async function signOutEverywhere(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    await supabase.auth.signOut({ scope: "local" });
    toast.success("Signed out on this device", {
      description: "We couldn't reach the server to revoke other devices.",
    });
    return;
  }
  toast.success("Signed out everywhere", {
    description: "Your session was revoked on all devices.",
  });
}

const WARN_MS = 5 * 60 * 1000;

export type SessionState = {
  /** ms until the access token expires, null when unknown/no session */
  msLeft: number | null;
  expiring: boolean;
  expired: boolean;
  extend: () => Promise<void>;
  extending: boolean;
  dismiss: () => void;
};

/** Watches the Supabase session and reports when it is about to expire. */
export function useSessionExpiry(): SessionState {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [extending, setExtending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setExpiresAt(data.session?.expires_at ? data.session.expires_at * 1000 : null);
    });
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      setExpiresAt(session?.expires_at ? session.expires_at * 1000 : null);
      setDismissed(false);
    });
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      alive = false;
      clearInterval(t);
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const extend = useCallback(async () => {
    setExtending(true);
    const { data, error } = await supabase.auth.refreshSession();
    setExtending(false);
    if (error || !data.session) {
      toast.error("Couldn't extend your session. Please sign in again.");
      return;
    }
    setExpiresAt(data.session.expires_at ? data.session.expires_at * 1000 : null);
    setDismissed(false);
    toast.success("Session extended");
  }, []);

  const msLeft = expiresAt === null ? null : expiresAt - now;

  return {
    msLeft,
    expiring: msLeft !== null && msLeft > 0 && msLeft <= WARN_MS && !dismissed,
    expired: msLeft !== null && msLeft <= 0,
    extend,
    extending,
    dismiss: () => setDismissed(true),
  };
}

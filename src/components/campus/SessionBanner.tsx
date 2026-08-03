import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "./ui";
import { currentNext, useSessionExpiry } from "@/lib/auth-session";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shows a countdown banner before the session expires and auto-logs the user
 * out when it does — preserving the current path + search as `next`.
 */
export function SessionBanner() {
  const { msLeft, expiring, expired, extend, extending, dismiss } = useSessionExpiry();
  const navigate = useNavigate();
  const kicked = useRef(false);

  useEffect(() => {
    if (!expired || kicked.current) return;
    kicked.current = true;
    const next = currentNext();
    (async () => {
      await supabase.auth.signOut({ scope: "local" });
      toast.error("Your session expired", { description: "Please sign in again to continue." });
      navigate({ to: "/login", search: { next }, replace: true });
    })();
  }, [expired, navigate]);

  if (expired) {
    return (
      <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-medium text-white">
        <ShieldAlert className="h-3.5 w-3.5" /> Session expired — taking you to sign in…
      </div>
    );
  }

  if (!expiring || msLeft === null) return null;
  const mins = Math.max(1, Math.round(msLeft / 60000));

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-foreground px-4 py-2 text-xs text-background">
      <span className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" /> Your session expires in about {mins} minute{mins === 1 ? "" : "s"}.
      </span>
      <Btn size="sm" variant="accent" onClick={extend} disabled={extending}>
        {extending ? "Extending…" : "Stay signed in"}
      </Btn>
      <button onClick={dismiss} className="underline opacity-70 hover:opacity-100">
        Dismiss
      </button>
    </div>
  );
}

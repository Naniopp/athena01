import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Sparkles, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, isValidEmail } from "@/lib/auth-errors";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — ATHENA" },
      { name: "description", content: "Request a secure password reset link for your ATHENA campus account." },
      { property: "og:title", content: "Reset your password — ATHENA" },
      { property: "og:description", content: "Request a secure password reset link for your ATHENA campus account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const tick = () =>
      setCooldown((s) => {
        if (s <= 1) return 0;
        setTimeout(tick, 1000);
        return s - 1;
      });
    setTimeout(tick, 1000);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Enter a valid email address, like you@college.edu.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setSent(true);
    startCooldown();
    toast.success("Password reset link sent to your email.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-[#F97316]/10 blur-3xl" />

      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
              <Sparkles className="h-4 w-4 text-[#F97316]" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-28">
        <div className="w-full animate-rise-in rounded-3xl border border-border/70 bg-card p-8 shadow-elegant sm:p-10">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
            Forgot your <span className="text-accent">password?</span>
          </h1>

          {sent ? (
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Check your inbox</p>
                  <p className="mt-1 text-emerald-700">
                    We sent a reset link to <span className="font-medium">{email}</span>. The link expires in 60 minutes —
                    check spam if you don't see it.
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  if (cooldown > 0) return;
                  setSent(false);
                  submit(e);
                }}
                disabled={cooldown > 0}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60 disabled:opacity-60"
              >
                {cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend reset link"}
              </button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email on your ATHENA account and we'll send a secure link to set a new password.
              </p>
              <form className="mt-8 space-y-5" onSubmit={submit}>
                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="fp-email">
                    Email Address
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 transition focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 active:translate-y-[1px] disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Remembered it?{" "}
                  <Link to="/login" className="font-semibold text-accent hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

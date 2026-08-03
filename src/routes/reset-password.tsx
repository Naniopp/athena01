import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — ATHENA" },
      { name: "description", content: "Choose a new password for your ATHENA campus account." },
      { property: "og:title", content: "Set a new password — ATHENA" },
      { property: "og:description", content: "Choose a new password for your ATHENA campus account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

type Phase = "checking" | "ready" | "invalid" | "done";

function score(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        done = true;
        setPhase("ready");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (done) return;
      const hash = window.location.hash;
      if (data.session || hash.includes("type=recovery")) setPhase("ready");
      else if (hash.includes("error")) setPhase("invalid");
      else setPhase(data.session ? "ready" : "invalid");
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setPhase("done");
    toast.success("Password updated. You're signed in.");
    setTimeout(() => navigate({ to: "/dashboard/student" }), 1400);
  }

  const s = score(password);
  const strength = ["Too weak", "Weak", "Fair", "Strong", "Excellent"][s];

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
        </nav>
      </header>

      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-28">
        <div className="w-full animate-rise-in rounded-3xl border border-border/70 bg-card p-8 shadow-elegant sm:p-10">
          {phase === "checking" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying your reset link…
            </div>
          )}

          {phase === "invalid" && <InvalidLink />}


          {phase === "done" && (
            <div className="space-y-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Password updated</h1>
              <p className="text-sm text-muted-foreground">Taking you to your campus workspace…</p>
            </div>
          )}

          {phase === "ready" && (
            <>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
                Set a <span className="text-accent">new password</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose something you haven't used before. You'll stay signed in after saving.
              </p>

              <form className="mt-8 space-y-5" onSubmit={submit}>
                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="rp-pw">
                    New password
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 transition focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <input
                      id="rp-pw"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShow((v) => !v)} className="text-muted-foreground hover:text-foreground">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[#F97316] transition-all"
                          style={{ width: `${(s / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{strength}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="rp-confirm">
                    Confirm password
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 transition focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <input
                      id="rp-confirm"
                      type={show ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your new password"
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
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, LayoutDashboard, Sparkles, Network, ShieldCheck, Loader2 } from "lucide-react";
import heroCampus from "@/assets/hero-campus.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : "",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — ATHENA" },
      { name: "description", content: "Sign in to your ATHENA campus account." },
      { property: "og:title", content: "Sign in — ATHENA" },
      { property: "og:description", content: "Sign in to your ATHENA campus account." },
    ],
  }),
  component: LoginPage,
});

function TopNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
            <Sparkles className="h-4 w-4 text-[#F97316]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#" className="hover:text-foreground">Platform</a>
          <a href="#" className="hover:text-foreground">Resources</a>
          <a href="#" className="hover:text-foreground">About</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
        <Link to="/signup" className="hidden rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#111]/90 md:inline-flex">
          Get Started
        </Link>
      </nav>
    </header>
  );
}

function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { next } = Route.useSearch();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (next) window.location.assign(next);
    else navigate({ to: "/dashboards" });
  }

  async function handleGoogle() {
    setError(null);
    const redirectTo = next
      ? `${window.location.origin}${next}`
      : `${window.location.origin}/dashboards`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <TopNav />

      {/* soft ambient glow */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-[#F97316]/10 blur-3xl" />

      <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-28 pb-16 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16 lg:px-10 lg:pt-32">
        {/* LEFT — auth card */}
        <div className="animate-rise-in">
          <div className="rounded-3xl border border-border/70 bg-white p-8 shadow-elegant sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome <span className="text-accent">Back</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your campus.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 transition">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 transition">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-[#F97316]" />
                  Remember me
                </label>
                <a href="#" className="font-medium text-accent hover:underline">Forgot Password?</a>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}

              <button type="submit" disabled={busy} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 active:translate-y-[1px] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}
              </button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2.5">
                <button type="button" onClick={handleGoogle} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60">
                  <GoogleIcon /> Continue with Google
                </button>
                <button type="button" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60">
                  <MicrosoftIcon /> Continue with Microsoft
                </button>
              </div>

              <p className="pt-2 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="font-semibold text-accent hover:underline">Get Started →</Link>
              </p>
            </form>
          </div>
        </div>

        {/* RIGHT — brand + illustration */}
        <div className="relative hidden lg:block">
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground xl:text-5xl">
              One Campus.<br />
              <span className="text-accent">Infinite</span> Possibilities.
            </h2>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              ATHENA unifies students, faculty, clubs, and administration into one intelligent platform.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-2 gap-4">
              <Highlight icon={<LayoutDashboard className="h-4 w-4" />} title="Smart Dashboards" desc="Role-based insights for everyone." />
              <Highlight icon={<Sparkles className="h-4 w-4" />} title="AI Assistant" desc="Your intelligent campus companion." />
              <Highlight icon={<Network className="h-4 w-4" />} title="Connected Campus" desc="All services. One seamless experience." />
              <Highlight icon={<ShieldCheck className="h-4 w-4" />} title="Secure & Reliable" desc="Enterprise-grade security for your data." />
            </div>
          </div>

          <div className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 xl:block">
            <div className="relative h-[560px] w-[620px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_0%,white_45%,transparent_75%)]" />
              <img
                src={heroCampus}
                alt="ATHENA 3D isometric smart campus with glowing orange AI core"
                className="animate-float-slow relative h-full w-full object-contain [mask-image:radial-gradient(circle_at_center,black_55%,transparent_78%)]"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Highlight({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F97316]/10 text-[#F97316]">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.4-4.8 9.4-9.3 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#F25022" d="M3 3h8v8H3z" />
      <path fill="#7FBA00" d="M13 3h8v8h-8z" />
      <path fill="#00A4EF" d="M3 13h8v8H3z" />
      <path fill="#FFB900" d="M13 13h8v8h-8z" />
    </svg>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, ShieldCheck, Building2, Hash, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createOwnerAccount, getSetupState } from "@/lib/rbac/bootstrap.functions";

export const Route = createFileRoute("/setup/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Initial setup — ATHENA" },
      { name: "description", content: "Create your institution and the ATHENA owner account." },
      { property: "og:title", content: "Initial setup — ATHENA" },
      { property: "og:description", content: "Set up your campus platform in one step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetupPage,
});

function Field({
  label, icon, value, onChange, type = "text", placeholder,
}: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; type?: string; placeholder: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 transition focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function SetupPage() {
  const navigate = useNavigate();
  const fetchState = useServerFn(getSetupState);
  const createOwner = useServerFn(createOwnerAccount);

  const state = useQuery({
    queryKey: ["athena", "setup-state"],
    queryFn: () => fetchState(),
    retry: false,
  });

  const [institutionName, setInstitutionName] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const result = await createOwner({
        data: { institutionName, institutionCode, ownerName, ownerEmail, password },
      });
      // Sign the owner straight in — no approval, no waiting.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail.trim().toLowerCase(),
        password,
      });
      setDone(true);
      setBusy(false);
      if (signInError) {
        setError("Account created. Please sign in with your new owner credentials.");
        return;
      }
      setTimeout(() => navigate({ href: result.redirectTo }), 900);
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Setup failed. Please try again.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#F97316]/10 blur-3xl" />
      <header className="relative mx-auto flex max-w-5xl items-center gap-2 px-6 py-6">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
          <Sparkles className="h-4 w-4 text-[#F97316]" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-24">
        {state.isLoading && (
          <div className="grid h-64 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
          </div>
        )}

        {state.data && !state.data.needsSetup && (
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-white p-10 text-center shadow-elegant">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Setup already completed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {state.data.institutionName
                ? `${state.data.institutionName} is already configured.`
                : "This platform already has an owner."}{" "}
              First-time setup is permanently closed. Sign in with the owner account to continue.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Go to sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {state.data?.needsSetup && (
          <div className="rounded-3xl border border-border bg-white p-8 shadow-elegant sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome to ATHENA</h1>
            <p className="mt-1 text-muted-foreground">Set up your campus platform</p>

            <form className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
              <Field label="Institution Name" icon={<Building2 className="h-4 w-4" />} value={institutionName} onChange={setInstitutionName} placeholder="Northbridge University" />
              <Field label="Institution Code" icon={<Hash className="h-4 w-4" />} value={institutionCode} onChange={setInstitutionCode} placeholder="NBU" />
              <Field label="Owner Name" icon={<User className="h-4 w-4" />} value={ownerName} onChange={setOwnerName} placeholder="Alex Johnson" />
              <Field label="Owner Email" icon={<Mail className="h-4 w-4" />} value={ownerEmail} onChange={setOwnerEmail} type="email" placeholder="owner@university.edu" />
              <Field label="Password" icon={<Lock className="h-4 w-4" />} value={password} onChange={setPassword} type="password" placeholder="••••••••" />
              <Field label="Confirm Password" icon={<Lock className="h-4 w-4" />} value={password2} onChange={setPassword2} type="password" placeholder="••••••••" />

              <div className="col-span-full rounded-2xl border border-border bg-[#FAFAFA] p-4 text-sm text-muted-foreground">
                This account becomes the institution owner with the <span className="font-medium text-foreground">Super Admin</span> role
                immediately — no approval and no waiting. Once created, this setup screen closes permanently.
              </div>

              {error && (
                <p role="alert" className="col-span-full flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
                </p>
              )}

              {done && !error && (
                <p className="col-span-full flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Account created successfully — Role: Super Admin. Taking you to your dashboard…
                </p>
              )}

              <button
                type="submit"
                disabled={busy || done}
                className="group col-span-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Creating ATHENA…" : "Create ATHENA"}
                <ArrowRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

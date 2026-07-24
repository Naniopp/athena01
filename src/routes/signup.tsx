import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  Presentation,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building2,
  IdCard,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Cloud,
  DatabaseBackup,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : "",
  }),
  head: () => ({
    meta: [
      { title: "Get started — ATHENA" },
      { name: "description", content: "Create your ATHENA account and join the intelligent campus." },
      { property: "og:title", content: "Get started — ATHENA" },
      { property: "og:description", content: "Create your ATHENA account in three quick steps." },
    ],
  }),
  component: SignupPage,
});

type Role = "student" | "faculty" | "club" | "admin";

const ROLES: { id: Role; title: string; desc: string; icon: React.ReactNode }[] = [
  { id: "student", title: "Student", desc: "Access classes, assignments, attend events and more.", icon: <GraduationCap className="h-6 w-6" /> },
  { id: "faculty", title: "Faculty", desc: "Manage classes, track performance and engage with students.", icon: <Presentation className="h-6 w-6" /> },
  { id: "club", title: "Club", desc: "Organize events, manage members and grow your club.", icon: <Users className="h-6 w-6" /> },
  { id: "admin", title: "Admin", desc: "Oversee operations, users, reports and analytics.", icon: <ShieldCheck className="h-6 w-6" /> },
];

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
        <Link to="/login" className="hidden rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60 md:inline-flex">
          Sign In
        </Link>
      </nav>
    </header>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Role" },
    { n: 2, label: "Verify" },
    { n: 3, label: "Details" },
  ];
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {items.map((it, i) => {
        const done = step > it.n;
        const active = step === it.n;
        return (
          <div key={it.n} className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition",
                  done ? "bg-[#F97316] text-white" : active ? "bg-[#F97316] text-white shadow-glow" : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {done ? <Check className="h-4 w-4" /> : it.n}
              </div>
              <span className={["text-sm", active || done ? "text-foreground font-medium" : "text-muted-foreground"].join(" ")}>{it.label}</span>
            </div>
            {i < items.length - 1 && (
              <div className={"h-px w-10 sm:w-16 " + (done ? "bg-[#F97316]" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <TopNav />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#F97316]/10 blur-3xl" />

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-28 lg:px-10 lg:pt-32">
        <div className="mb-10 animate-rise-in">
          <Stepper step={step} />
        </div>

        {step === 1 && (
          <StepRole
            role={role}
            onSelect={setRole}
            onContinue={() => role && setStep(2)}
          />
        )}
        {step === 2 && (
          <StepVerify
            email={email}
            setEmail={setEmail}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepDetails
            role={role ?? "student"}
            email={email}
            onBack={() => setStep(2)}
            onFinish={() => navigate({ to: "/dashboards" })}
          />
        )}
      </main>
    </div>
  );
}

function StepRole({ role, onSelect, onContinue }: { role: Role | null; onSelect: (r: Role) => void; onContinue: () => void }) {
  return (
    <div className="mx-auto max-w-3xl animate-rise-in">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Join ATHENA</h1>
        <p className="mt-2 text-muted-foreground">Select your role to get started.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((r) => {
          const selected = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={[
                "group relative flex items-start gap-4 rounded-3xl border p-6 text-left transition-all",
                selected
                  ? "border-[#F97316] bg-[#F97316]/5 shadow-glow -translate-y-0.5"
                  : "border-border bg-white hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elegant",
              ].join(" ")}
            >
              <div className={[
                "grid h-12 w-12 place-items-center rounded-2xl transition",
                selected ? "bg-[#F97316] text-white" : "bg-muted text-foreground",
              ].join(" ")}>
                {r.icon}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-foreground">{r.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{r.desc}</div>
              </div>
              {selected && (
                <div className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-[#F97316] text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          disabled={!role}
          onClick={onContinue}
          className="group inline-flex items-center gap-2 rounded-2xl bg-[#F97316] px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
          <ArrowRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function StepVerify({ email, setEmail, onBack, onContinue }: { email: string; setEmail: (v: string) => void; onBack: () => void; onContinue: () => void }) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const filled = otp.every((c) => c !== "");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      const next = [...otp];
      next[i] = "";
      setOtp(next);
      return;
    }
    if (digits.length > 1) {
      // Paste flow
      const next = [...otp];
      for (let j = 0; j < 6 - i; j++) next[i + j] = digits[j] ?? "";
      setOtp(next);
      const focusIdx = Math.min(i + digits.length, 5);
      refs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const sendCode = async () => {
    setError(null);
    setInfo(null);
    if (!emailValid) {
      setError("Enter a valid email address.");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboards`,
      },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
    setOtp(["", "", "", "", "", ""]);
    setSeconds(45);
    setInfo(`We sent a 6-digit code to ${email}.`);
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  const verifyCode = async () => {
    setError(null);
    setInfo(null);
    const token = otp.join("");
    if (token.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setVerifying(false);
    if (error) {
      setError(error.message);
      return;
    }
    onContinue();
  };

  return (
    <div className="mx-auto max-w-md animate-rise-in">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-elegant sm:p-10">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#F97316]/10">
          <Mail className="h-8 w-8 text-[#F97316]" />
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Verify Your Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent ? "Enter the 6-digit code we sent to" : "We'll send a 6-digit verification code to"}
          </p>

          {sent ? (
            <p className="text-sm font-medium text-foreground">{email}</p>
          ) : (
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-center text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
            />
          )}
        </div>

        {sent && (
          <div className="mt-6 flex justify-center gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
                }}
                inputMode="numeric"
                maxLength={6}
                className={[
                  "h-12 w-11 rounded-xl border text-center text-lg font-semibold outline-none transition sm:h-14 sm:w-12",
                  d ? "border-[#F97316] bg-[#F97316]/5 text-foreground scale-[1.03]" : "border-border bg-white text-foreground",
                  "focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 text-center text-xs font-medium text-red-600">{error}</p>
        )}
        {info && !error && (
          <p className="mt-4 text-center text-xs text-muted-foreground">{info}</p>
        )}

        {sent && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {seconds > 0 ? (
              <>Resend code in <span className="font-medium text-foreground">00:{seconds.toString().padStart(2, "0")}</span></>
            ) : (
              <button onClick={sendCode} disabled={sending} className="font-medium text-accent hover:underline disabled:opacity-50">
                {sending ? "Sending…" : "Resend code"}
              </button>
            )}
          </p>
        )}

        {!sent ? (
          <button
            disabled={!emailValid || sending}
            onClick={sendCode}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {sending ? "Sending code…" : "Send Verification Code"}
          </button>
        ) : (
          <button
            disabled={!filled || verifying}
            onClick={verifyCode}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {verifying ? "Verifying…" : "Verify & Continue"}
            {!verifying && <ArrowRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />}
          </button>
        )}

        {sent && (
          <button
            onClick={() => { setSent(false); setOtp(["", "", "", "", "", ""]); setError(null); setInfo(null); }}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        )}
      </div>
    </div>
  );
}

function StepDetails({ role, email, onBack, onFinish }: { role: Role; email: string; onBack: () => void; onFinish: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("Northbridge University");
  const [idNumber, setIdNumber] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [semester, setSemester] = useState("Semester 1");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idLabel = useMemo(() => {
    if (role === "student") return "Student ID";
    if (role === "faculty") return "Faculty ID";
    if (role === "club") return "Club ID";
    return "Admin ID";
  }, [role]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agree) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        role,
        full_name: fullName,
        university,
        id_number: idNumber,
        department,
        semester,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    onFinish();
  };

  return (
    <div className="grid animate-rise-in gap-8 lg:grid-cols-[1fr_340px]">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-elegant sm:p-10">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mt-4">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create Your Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tell us a few details to set up your {role} account.</p>
        </div>

        <form className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Full Name" icon={<User className="h-4 w-4" />} placeholder="Alex Johnson" value={fullName} onChange={setFullName} />
          <Field label="University Email" icon={<Mail className="h-4 w-4" />} placeholder="alex@university.edu" value={email} onChange={() => {}} type="email" readOnly />
          <SelectField label="University" icon={<Building2 className="h-4 w-4" />} options={["Northbridge University", "Riverside Institute", "Metro College"]} value={university} onChange={setUniversity} />
          <Field label={idLabel} icon={<IdCard className="h-4 w-4" />} placeholder="NU23CS1001" value={idNumber} onChange={setIdNumber} />
          <SelectField label="Department" icon={<BookOpen className="h-4 w-4" />} options={["Computer Science", "Mechanical", "Business", "Design"]} value={department} onChange={setDepartment} />
          <SelectField label="Year / Semester" icon={<CalendarDays className="h-4 w-4" />} options={["Semester 1", "Semester 3", "Semester 5", "Semester 7"]} value={semester} onChange={setSemester} />

          <PasswordField label="Password" show={showPw} onToggle={() => setShowPw((s) => !s)} value={password} onChange={setPassword} />
          <PasswordField label="Confirm Password" show={showPw2} onToggle={() => setShowPw2((s) => !s)} value={password2} onChange={setPassword2} />

          <label className="col-span-full flex items-start gap-2.5 text-sm text-muted-foreground">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-[#F97316]" />
            <span>
              I agree to the <a href="#" className="font-medium text-accent hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="font-medium text-accent hover:underline">Privacy Policy</a>
            </span>
          </label>

          {error && (
            <p className="col-span-full text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={!agree || submitting}
            className="group col-span-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Creating account…" : "Create Account"}
            <ArrowRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>

      {/* Security card */}
      <aside className="h-fit rounded-3xl border border-border bg-[#FAFAFA] p-7 shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Your data is safe<br />with ATHENA</h3>
        <ul className="mt-5 space-y-3 text-sm text-foreground">
          {[
            { i: <KeyRound className="h-4 w-4" />, t: "End-to-end encryption" },
            { i: <ShieldCheck className="h-4 w-4" />, t: "Role-based access" },
            { i: <Cloud className="h-4 w-4" />, t: "Secure cloud infrastructure" },
            { i: <DatabaseBackup className="h-4 w-4" />, t: "Regular backups" },
          ].map((it, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#F97316] shadow-soft">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{it.t}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-8 grid h-40 place-items-center overflow-hidden rounded-2xl bg-white">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative grid h-20 w-20 place-items-center rounded-2xl bg-[#F97316] text-white shadow-glow animate-pulse-glow">
            <ShieldCheck className="h-10 w-10" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, icon, placeholder, type = "text", value, onChange, readOnly }: { label: string; icon: React.ReactNode; placeholder: string; type?: string; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 transition">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function SelectField({ label, icon, options, value, onChange }: { label: string; icon: React.ReactNode; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 transition">
        <span className="text-muted-foreground">{icon}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none">
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PasswordField({ label, show, onToggle, value, onChange }: { label: string; show: boolean; onToggle: () => void; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 transition">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

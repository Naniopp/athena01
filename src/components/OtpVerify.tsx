import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

type Mode = "signup" | "login";

type Props = {
  mode: Mode;
  email: string;
  setEmail: (v: string) => void;
  onBack?: () => void;
  onVerified: () => void;
  title?: string;
  subtitle?: string;
  resendSeconds?: number;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "error"; message: string }
  | { kind: "info"; message: string };

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function OtpVerify({
  mode: _mode,
  email,
  setEmail,
  onBack,
  onVerified,
  title = "Verify Your Email",
  subtitle,
  resendSeconds = 60,
}: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(0);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const filled = otp.every((c) => c !== "");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const expired = issuedAt !== null && Date.now() - issuedAt > CODE_TTL_MS;

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      const next = [...otp];
      next[i] = "";
      setOtp(next);
      return;
    }
    if (digits.length > 1) {
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
    if (!emailValid) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return;
    }
    setStatus({ kind: "sending" });
    // Simulate network delay for realism
    await new Promise((r) => setTimeout(r, 500));
    const code = generateCode();
    setGeneratedCode(code);
    setIssuedAt(Date.now());
    setAttempts(0);
    setSent(true);
    setOtp(["", "", "", "", "", ""]);
    setSeconds(resendSeconds);
    setStatus({ kind: "info", message: `Verification code generated for ${email}. It expires in 10 minutes.` });
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  const verifyCode = async () => {
    const token = otp.join("");
    if (token.length !== 6) {
      setStatus({ kind: "error", message: "Enter the 6-digit code." });
      return;
    }
    if (!generatedCode) {
      setStatus({ kind: "error", message: "Please request a code first." });
      return;
    }
    if (expired) {
      setStatus({ kind: "error", message: "This code has expired. Request a new one to continue." });
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      setStatus({ kind: "error", message: "Too many incorrect attempts. Please request a new code." });
      return;
    }
    setStatus({ kind: "verifying" });
    await new Promise((r) => setTimeout(r, 400));
    if (token !== generatedCode) {
      setAttempts((a) => a + 1);
      const remaining = MAX_ATTEMPTS - (attempts + 1);
      setStatus({
        kind: "error",
        message:
          remaining > 0
            ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
      return;
    }
    setStatus({ kind: "success" });
    setTimeout(() => onVerified(), 700);
  };

  const busy = status.kind === "sending" || status.kind === "verifying" || status.kind === "success";

  return (
    <div className="mx-auto max-w-md animate-rise-in">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-elegant sm:p-10">
        {onBack && (
          <div className="mb-6 flex items-center justify-between">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        )}

        <div className={[
          "mx-auto grid h-20 w-20 place-items-center rounded-full transition",
          status.kind === "success" ? "bg-green-100" : "bg-[#F97316]/10",
        ].join(" ")}>
          {status.kind === "success" ? (
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          ) : (
            <Mail className="h-8 w-8 text-[#F97316]" />
          )}
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {status.kind === "success" ? "Verified!" : title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {status.kind === "success"
              ? "Continuing…"
              : subtitle ?? (sent ? "Enter the 6-digit code we generated for" : "We'll generate a 6-digit verification code for")}
          </p>

          {status.kind !== "success" && (
            sent ? (
              <p className="text-sm font-medium text-foreground">{email}</p>
            ) : (
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-center text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
              />
            )
          )}
        </div>

        {sent && generatedCode && status.kind !== "success" && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-dashed border-[#F97316]/40 bg-[#F97316]/5 p-3 text-left text-xs text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#F97316]" />
            <div>
              <div className="font-semibold text-[#F97316]">Developer Mode</div>
              <div className="mt-0.5">
                OTP: <span className="font-mono text-base font-bold tracking-[0.3em] text-foreground">{generatedCode}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">Shown for demo only. Hide in production.</div>
            </div>
          </div>
        )}

        {sent && status.kind !== "success" && (
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
                disabled={busy}
                inputMode="numeric"
                maxLength={6}
                className={[
                  "h-12 w-11 rounded-xl border text-center text-lg font-semibold outline-none transition sm:h-14 sm:w-12",
                  d ? "border-[#F97316] bg-[#F97316]/5 text-foreground scale-[1.03]" : "border-border bg-white text-foreground",
                  status.kind === "error" ? "border-red-400 bg-red-50" : "",
                  "focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:opacity-60",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        {status.kind === "error" && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}
        {status.kind === "info" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">{status.message}</p>
        )}

        {sent && status.kind !== "success" && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {seconds > 0 ? (
              <>Resend code in <span className="font-medium text-foreground">00:{seconds.toString().padStart(2, "0")}</span></>
            ) : (
              <button onClick={sendCode} disabled={busy} className="font-medium text-accent hover:underline disabled:opacity-50">
                {status.kind === "sending" ? "Sending…" : "Resend code"}
              </button>
            )}
          </p>
        )}

        {!sent ? (
          <button
            disabled={!emailValid || busy}
            onClick={sendCode}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status.kind === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {status.kind === "sending" ? "Generating code…" : "Send Verification Code"}
          </button>
        ) : status.kind !== "success" ? (
          <button
            disabled={!filled || busy}
            onClick={verifyCode}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status.kind === "verifying" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {status.kind === "verifying" ? "Verifying…" : "Verify & Continue"}
            {status.kind !== "verifying" && <ArrowRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />}
          </button>
        ) : (
          <div className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4" /> Success
          </div>
        )}

        {sent && status.kind !== "success" && (
          <button
            onClick={() => {
              setSent(false);
              setOtp(["", "", "", "", "", ""]);
              setStatus({ kind: "idle" });
              setGeneratedCode(null);
              setIssuedAt(null);
              setAttempts(0);
            }}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  canSendOtp,
  canVerifyOtp,
  clearVerifyState,
  humanizeOtpError,
  isCodeExpired,
  recordOtpSend,
  recordVerifyAttempt,
} from "@/lib/otp-rate-limit";

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

export function OtpVerify({
  mode,
  email,
  setEmail,
  onBack,
  onVerified,
  title = "Verify Your Email",
  subtitle,
  resendSeconds = 45,
}: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(0);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // Expiration ticker — flip to error when the issued code passes TTL.
  useEffect(() => {
    if (!sent) return;
    const t = setInterval(() => {
      if (isCodeExpired(email)) {
        setStatus({ kind: "error", message: "This code has expired. Request a new one to continue." });
      }
    }, 5000);
    return () => clearInterval(t);
  }, [sent, email]);

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
    const gate = canSendOtp(email);
    if (!gate.ok) {
      const mins = Math.ceil(gate.retryInSec / 60);
      setStatus({
        kind: "error",
        message: `Too many code requests for this email. Try again in ~${mins} minute${mins === 1 ? "" : "s"}.`,
      });
      return;
    }
    setStatus({ kind: "sending" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
        emailRedirectTo: `${window.location.origin}/dashboards`,
      },
    });
    if (error) {
      setStatus({ kind: "error", message: humanizeOtpError(error.message) });
      return;
    }
    recordOtpSend(email);
    setSent(true);
    setOtp(["", "", "", "", "", ""]);
    setSeconds(resendSeconds);
    setStatus({ kind: "info", message: `We sent a 6-digit code to ${email}. It expires in 10 minutes.` });
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  const verifyCode = async () => {
    const token = otp.join("");
    if (token.length !== 6) {
      setStatus({ kind: "error", message: "Enter the 6-digit code." });
      return;
    }
    const gate = canVerifyOtp(email);
    if (!gate.ok) {
      setStatus({ kind: "error", message: gate.reason });
      return;
    }
    setStatus({ kind: "verifying" });
    recordVerifyAttempt(email);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setStatus({ kind: "error", message: humanizeOtpError(error.message) });
      return;
    }
    setStatus({ kind: "success" });
    clearVerifyState(email);
    // brief success state before transitioning
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
              ? "Signing you in…"
              : subtitle ?? (sent ? "Enter the 6-digit code we sent to" : "We'll send a 6-digit verification code to")}
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
            {status.kind === "sending" ? "Sending code…" : "Send Verification Code"}
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
            onClick={() => { setSent(false); setOtp(["", "", "", "", "", ""]); setStatus({ kind: "idle" }); clearVerifyState(email); }}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        )}
      </div>
    </div>
  );
}

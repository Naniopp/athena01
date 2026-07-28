// Client-side OTP rate limiting + error normalization.
// Server-side rate limiting is enforced by Supabase Auth; this adds a
// UX-level guard to prevent brute-force attempts and repeated resends.

const SEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SEND_MAX = 3; // sends per window per email
const VERIFY_MAX = 5; // verify attempts per issued code
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes (Supabase default)

type SendLog = { email: string; ts: number[] };

function readSendLog(email: string): number[] {
  try {
    const raw = localStorage.getItem(`athena.otp.sends.${email}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SendLog;
    return (parsed.ts ?? []).filter((t) => Date.now() - t < SEND_WINDOW_MS);
  } catch {
    return [];
  }
}

function writeSendLog(email: string, ts: number[]) {
  try {
    localStorage.setItem(`athena.otp.sends.${email}`, JSON.stringify({ email, ts }));
  } catch {
    /* ignore */
  }
}

export function canSendOtp(email: string): { ok: true } | { ok: false; retryInSec: number } {
  const log = readSendLog(email);
  if (log.length < SEND_MAX) return { ok: true };
  const oldest = Math.min(...log);
  const retryInSec = Math.max(1, Math.ceil((SEND_WINDOW_MS - (Date.now() - oldest)) / 1000));
  return { ok: false, retryInSec };
}

export function recordOtpSend(email: string) {
  const log = readSendLog(email);
  log.push(Date.now());
  writeSendLog(email, log);
  // Reset verify counter on new send
  try {
    sessionStorage.setItem(`athena.otp.verify.${email}`, JSON.stringify({ count: 0, issuedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function getIssuedAt(email: string): number | null {
  try {
    const raw = sessionStorage.getItem(`athena.otp.verify.${email}`);
    if (!raw) return null;
    return (JSON.parse(raw) as { issuedAt: number }).issuedAt ?? null;
  } catch {
    return null;
  }
}

export function isCodeExpired(email: string): boolean {
  const issuedAt = getIssuedAt(email);
  if (!issuedAt) return false;
  return Date.now() - issuedAt > CODE_TTL_MS;
}

export function canVerifyOtp(email: string): { ok: true } | { ok: false; reason: string } {
  if (isCodeExpired(email)) {
    return { ok: false, reason: "Your code has expired. Please request a new one." };
  }
  try {
    const raw = sessionStorage.getItem(`athena.otp.verify.${email}`);
    const count = raw ? (JSON.parse(raw).count ?? 0) : 0;
    if (count >= VERIFY_MAX) {
      return { ok: false, reason: "Too many incorrect attempts. Please request a new code." };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function recordVerifyAttempt(email: string) {
  try {
    const raw = sessionStorage.getItem(`athena.otp.verify.${email}`);
    const parsed = raw ? JSON.parse(raw) : { count: 0, issuedAt: Date.now() };
    parsed.count = (parsed.count ?? 0) + 1;
    sessionStorage.setItem(`athena.otp.verify.${email}`, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

export function clearVerifyState(email: string) {
  try {
    sessionStorage.removeItem(`athena.otp.verify.${email}`);
  } catch {
    /* ignore */
  }
}

// Map raw Supabase auth error messages to user-friendly copy.
export function humanizeOtpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired")) return "This code has expired. Request a new one to continue.";
  if (m.includes("invalid") || m.includes("incorrect") || m.includes("token") && m.includes("not")) {
    return "That code is incorrect. Please double-check and try again.";
  }
  if (m.includes("already") && (m.includes("used") || m.includes("confirmed"))) {
    return "This code was already used. Please request a new one.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  if (m.includes("not found") || m.includes("no user")) {
    return "We couldn't find that email. Check the address or create an account.";
  }
  return message;
}

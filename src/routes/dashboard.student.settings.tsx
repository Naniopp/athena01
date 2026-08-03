import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sun, Moon, Download, RotateCcw, LogOut, ShieldOff, Monitor, Smartphone, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { signOutEverywhere } from "@/lib/auth-session";
import { useCampus } from "@/lib/campus/store";
import { Card, PageHeader, Toggle, Btn, Modal, Badge, timeAgo } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — ATHENA" },
      { name: "description", content: "Appearance, privacy, notifications, and account settings." },
      { property: "og:title", content: "Settings — ATHENA" },
      { property: "og:description", content: "Appearance, privacy, notifications, and account settings." },
    ],
  }),
});

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada"];
const TIMEZONES = ["Asia/Kolkata (GMT+5:30)", "Asia/Dubai (GMT+4:00)", "UTC (GMT+0:00)", "America/New_York (GMT-5:00)"];

function SettingsPage() {
  const settings = useCampus((s) => s.settings);
  const setSettings = useCampus((s) => s.setSettings);
  const toggleTheme = useCampus((s) => s.toggleTheme);
  const sessions = useCampus((s) => s.sessions);
  const logins = useCampus((s) => s.logins);
  const revokeSession = useCampus((s) => s.revokeSession);
  const revokeAllSessions = useCampus((s) => s.revokeAllSessions);
  const resetAll = useCampus((s) => s.resetAll);
  const navigate = useNavigate();

  const [resetOpen, setResetOpen] = useState(false);
  const [blockedInput, setBlockedInput] = useState("");

  const unblock = (name: string) => {
    setSettings({ blocked: settings.blocked.filter((b) => b !== name) });
    toast.success(`Unblocked ${name}`);
  };
  const block = () => {
    const v = blockedInput.trim();
    if (!v) return;
    if (!settings.blocked.includes(v)) setSettings({ blocked: [...settings.blocked, v] });
    setBlockedInput("");
    toast.success(`Blocked ${v}`);
  };

  const exportData = () => {
    const state = useCampus.getState();
    const { hydrated: _h, ...rest } = state as unknown as Record<string, unknown>;
    const cleaned = Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
    const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "athena-campus-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const doReset = () => {
    resetAll();
    setResetOpen(false);
    toast.success("Demo data reset");
  };

  const [signingOut, setSigningOut] = useState(false);
  const signOut = async () => {
    setSigningOut(true);
    await signOutEverywhere();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Control your appearance, privacy, and account." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-2 text-sm font-semibold text-foreground">Appearance</p>
          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                {settings.theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <p className="text-sm font-medium text-foreground">Theme</p>
              </div>
              <Btn size="sm" variant="outline" onClick={toggleTheme}>{settings.theme === "dark" ? "Switch to light" : "Switch to dark"}</Btn>
            </div>
            <Toggle checked={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} label="Reduce motion" description="Minimize animations across the app" />
            <Toggle checked={settings.largeText} onChange={(v) => setSettings({ largeText: v })} label="Large text" description="Increase base font size" />
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Language & timezone</p>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Language</span>
              <select value={settings.language} onChange={(e) => setSettings({ language: e.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Timezone</span>
              <select value={settings.timezone} onChange={(e) => setSettings({ timezone: e.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none">
                {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <p className="mb-2 text-sm font-semibold text-foreground">Notifications</p>
          <div className="divide-y divide-border/60">
            <Toggle checked={settings.notif.enabled} onChange={(v) => setSettings({ notif: { ...settings.notif, enabled: v } })} label="Enable notifications" />
            <Toggle checked={settings.notif.email} onChange={(v) => setSettings({ notif: { ...settings.notif, email: v } })} label="Email" />
            <Toggle checked={settings.notif.push} onChange={(v) => setSettings({ notif: { ...settings.notif, push: v } })} label="Push" />
            <Toggle checked={settings.notif.events} onChange={(v) => setSettings({ notif: { ...settings.notif, events: v } })} label="Events" />
            <Toggle checked={settings.notif.assignments} onChange={(v) => setSettings({ notif: { ...settings.notif, assignments: v } })} label="Assignments" />
            <Toggle checked={settings.notif.messages} onChange={(v) => setSettings({ notif: { ...settings.notif, messages: v } })} label="Messages" />
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Privacy</p>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Profile visibility</span>
            <select value={settings.privacy.profileVisibility} onChange={(e) => setSettings({ privacy: { ...settings.privacy, profileVisibility: e.target.value as never } })} className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none">
              <option value="public">Public</option>
              <option value="campus">Campus only</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="divide-y divide-border/60">
            <Toggle checked={settings.privacy.showAchievements} onChange={(v) => setSettings({ privacy: { ...settings.privacy, showAchievements: v } })} label="Show achievements" />
            <Toggle checked={settings.privacy.showEmail} onChange={(v) => setSettings({ privacy: { ...settings.privacy, showEmail: v } })} label="Show email" />
          </div>

          <p className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldOff className="h-4 w-4" /> Blocked users</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {settings.blocked.length === 0 && <p className="text-xs text-muted-foreground">No blocked users.</p>}
            {settings.blocked.map((b) => (
              <span key={b} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                {b}<button onClick={() => unblock(b)} className="text-[var(--accent)] hover:underline">Unblock</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={blockedInput} onChange={(e) => setBlockedInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && block()} placeholder="Add name to block" className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none" />
            <Btn size="sm" variant="outline" onClick={block}>Block</Btn>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Active sessions</p>
            {sessions.length > 1 && <button onClick={() => { revokeAllSessions(); toast.success("All other sessions revoked"); }} className="text-xs text-destructive hover:opacity-80">Revoke all others</button>}
          </div>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  {s.device.toLowerCase().includes("iphone") ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : <Monitor className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm text-foreground">{s.device} {s.current && <Badge tone="accent">This device</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{s.location} · {timeAgo(s.at)}</p>
                  </div>
                </div>
                {!s.current && <Btn size="sm" variant="danger" onClick={() => { revokeSession(s.id); toast.success("Session revoked"); }}>Revoke</Btn>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Recent login history</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground"><th className="py-2 pr-4">Device</th><th className="py-2 pr-4">IP</th><th className="py-2">When</th></tr>
              </thead>
              <tbody>
                {logins.map((l, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 text-foreground">{l.device}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{l.ip}</td>
                    <td className="py-2.5 text-muted-foreground">{timeAgo(l.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Data</p>
          <div className="flex flex-wrap gap-3">
            <Btn variant="outline" onClick={exportData}><Download className="h-4 w-4" /> Export JSON</Btn>
            <Btn variant="danger" onClick={() => setResetOpen(true)}><RotateCcw className="h-4 w-4" /> Reset demo data</Btn>
          </div>
        </Card>

        <ChangePassword />

        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Account</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Signing out revokes your session on every device you're logged in on.
          </p>
          <Btn variant="danger" onClick={signOut} disabled={signingOut}>
            <LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out of all devices"}
          </Btn>
        </Card>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset demo data?">
        <p className="text-sm text-muted-foreground">This will erase your local changes and restore ATHENA to its default demo state. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setResetOpen(false)}>Cancel</Btn>
          <Btn variant="danger" onClick={doReset}>Reset everything</Btn>
        </div>
      </Modal>
    </div>
  );
}

function pwScore(pw: string) {
  let n = 0;
  if (pw.length >= 8) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const cls =
    "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (next.length < 8) return setError("Your new password must be at least 8 characters.");
    if (pwScore(next) < 3) return setError("Use a mix of uppercase letters, numbers, or symbols to strengthen it.");
    if (next !== confirm) return setError("The two new passwords don't match.");
    if (next === current) return setError("Your new password must be different from your current one.");

    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (email && current) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) {
        setBusy(false);
        return setError("Your current password is incorrect.");
      }
    }
    const { error: upErr } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (upErr) return setError(friendlyAuthError(upErr.message));
    setCurrent("");
    setNext("");
    setConfirm("");
    setOk(true);
    toast.success("Password updated");
  };

  const s = pwScore(next);
  const strength = ["Too weak", "Weak", "Fair", "Strong", "Excellent"][s];

  return (
    <Card>
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
        <KeyRound className="h-4 w-4" /> Change password
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        You'll stay signed in on this device. Other devices keep their sessions until you sign out everywhere.
      </p>
      <form className="space-y-3" onSubmit={submit}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Current password</span>
          <input type="password" className={cls} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Leave blank if you signed in with Google or a code" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">New password</span>
          <input type="password" className={cls} value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" />
        </label>
        {next && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(s / 4) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{strength}</span>
          </div>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm new password</span>
          <input type="password" className={cls} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" />
        </label>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
        {ok && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Password updated successfully.
          </p>
        )}

        <Btn type="submit" variant="accent" disabled={busy}>{busy ? "Updating…" : "Update password"}</Btn>
      </form>
    </Card>
  );
}

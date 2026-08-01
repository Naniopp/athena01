import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useCampus } from "@/lib/campus/store";
import { seedAttendance } from "@/lib/campus/seed";
import { Card, PageHeader, Progress, Badge, Skeleton, useLoading, Field, Btn, Toggle } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/attendance")({
  component: AttendancePage,
  head: () => ({
    meta: [
      { title: "Attendance · ATHENA" },
      { name: "description", content: "Track attendance across courses, spot at-risk subjects, and forecast future percentages." },
      { property: "og:title", content: "Attendance · ATHENA" },
      { property: "og:description", content: "Attendance analytics with trends and a what-if calculator." },
    ],
  }),
});

const THRESHOLD = 75;

function pct(a: number, t: number) {
  return t === 0 ? 0 : Math.round((a / t) * 100);
}

function AttendancePage() {
  const loading = useLoading(500);
  const notif = useCampus((s) => s.settings.notif);
  const setSettings = useCampus((s) => s.setSettings);
  const pushNotification = useCampus((s) => s.pushNotification);
  const [notifyMe, setNotifyMe] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(seedAttendance[0].courseId);
  const [whatIfCourse, setWhatIfCourse] = useState(seedAttendance[0].courseId);
  const [plannedClasses, setPlannedClasses] = useState("5");

  const overallAttended = seedAttendance.reduce((a, c) => a + c.attended, 0);
  const overallTotal = seedAttendance.reduce((a, c) => a + c.total, 0);
  const overallPct = pct(overallAttended, overallTotal);
  const atRisk = seedAttendance.filter((c) => pct(c.attended, c.total) < THRESHOLD);

  const selected = seedAttendance.find((c) => c.courseId === selectedCourse) ?? seedAttendance[0];

  const barData = useMemo(
    () => seedAttendance.map((c) => ({ code: c.courseCode, percent: pct(c.attended, c.total) })),
    [],
  );

  const whatIf = useMemo(() => {
    const course = seedAttendance.find((c) => c.courseId === whatIfCourse) ?? seedAttendance[0];
    const n = Math.max(0, Math.min(60, parseInt(plannedClasses || "0", 10) || 0));
    const projected = pct(course.attended + n, course.total + n);
    return { course, n, projected };
  }, [whatIfCourse, plannedClasses]);

  const handleNotifyToggle = (v: boolean) => {
    setNotifyMe(v);
    setSettings({ notif: { ...notif, attendance: v } });
    if (v) {
      atRisk.forEach((c) => {
        pushNotification({
          title: "Attendance alert enabled",
          body: `You'll be notified if ${c.title} drops below ${THRESHOLD}%.`,
          kind: "attendance",
        });
      });
      toast.success(atRisk.length > 0 ? `Watching ${atRisk.length} at-risk course(s)` : "Attendance alerts enabled");
    } else {
      toast("Attendance alerts turned off");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Attendance" subtitle="Loading analytics..." />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="mt-6 h-72" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Overall attendance and per-course breakdown for this semester."
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${overallPct * 3.6}deg, var(--muted) 0deg)` }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-sm font-semibold text-foreground">{overallPct}%</div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Overall attendance</p>
            <p className="text-xs text-muted-foreground">{overallAttended} / {overallTotal} classes attended</p>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /><p className="text-sm font-medium text-foreground">Safe courses</p></div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{seedAttendance.length - atRisk.length}</p>
          <p className="text-xs text-muted-foreground">At or above {THRESHOLD}%</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /><p className="text-sm font-medium text-foreground">At risk</p></div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{atRisk.length}</p>
          <p className="text-xs text-muted-foreground">Below {THRESHOLD}% threshold</p>
        </Card>
      </div>

      {/* Notify toggle */}
      <Card className="mt-6">
        <Toggle
          checked={notifyMe}
          onChange={handleNotifyToggle}
          label="Notify me if a course drops below 75%"
          description="Get a push notification whenever a course's attendance falls under the safe threshold."
        />
      </Card>

      {/* Per-course rows */}
      <Card className="mt-6">
        <p className="mb-4 text-sm font-semibold text-foreground">Course-wise attendance</p>
        <div className="space-y-4">
          {seedAttendance.map((c) => {
            const p = pct(c.attended, c.total);
            const risk = p < THRESHOLD;
            return (
              <button
                key={c.courseId}
                onClick={() => setSelectedCourse(c.courseId)}
                className={`block w-full rounded-2xl border p-4 text-left transition ${selectedCourse === c.courseId ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-border hover:bg-muted"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.courseCode} · {c.attended}/{c.total} classes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{p}%</span>
                    <Badge tone={risk ? "danger" : "success"}>{risk ? "At risk" : "Safe"}</Badge>
                  </div>
                </div>
                <div className="mt-3"><Progress value={p} tone={risk ? "accent" : "ink"} /></div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Monthly trend</p>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none"
            >
              {seedAttendance.map((c) => <option key={c.courseId} value={c.courseId}>{c.courseCode}</option>)}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selected.monthly}>
                <defs>
                  <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="percent" stroke="var(--accent)" fill="url(#attFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Course comparison</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="percent" radius={[8, 8, 0, 0]} fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* What-if calculator */}
      <Card className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-sm font-semibold text-foreground">What-if calculator</p>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Project your attendance if you attend the next N classes without missing any.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Course</span>
            <select
              value={whatIfCourse}
              onChange={(e) => setWhatIfCourse(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
            >
              {seedAttendance.map((c) => <option key={c.courseId} value={c.courseId}>{c.courseCode} · {c.title}</option>)}
            </select>
          </label>
          <Field label="Classes you plan to attend" value={plannedClasses} onChange={setPlannedClasses} type="number" placeholder="5" />
          <div className="flex flex-col justify-end">
            <p className="text-xs text-muted-foreground">Projected attendance</p>
            <p className={`text-2xl font-semibold ${whatIf.projected < THRESHOLD ? "text-destructive" : "text-emerald-600"}`}>{whatIf.projected}%</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={whatIf.projected} tone={whatIf.projected < THRESHOLD ? "accent" : "ink"} />
        </div>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart as LineChartIcon,
  LogOut,
  Megaphone,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import campusHero from "@/assets/dashboards-campus.png";

export const Route = createFileRoute("/dashboards")({
  validateSearch: (s: Record<string, unknown>): { role?: Role } => {
    const r = s.role;
    return r === "student" || r === "faculty" || r === "club" || r === "admin" ? { role: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Explore ATHENA Dashboards — Live Demo" },
      {
        name: "description",
        content:
          "Preview ATHENA's role-based dashboards for Students, Faculty, Clubs, and Administration with fully interactive demo data.",
      },
      { property: "og:title", content: "Explore ATHENA Dashboards" },
      {
        property: "og:description",
        content: "Interactive demo of the ATHENA campus operating system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardsPage,
});

type Role = "student" | "faculty" | "club" | "admin";

const ACCENT = "#F97316";
const INK = "#111111";

/* =========================================================
   PAGE
   ========================================================= */
function DashboardsPage() {
  const search = Route.useSearch();
  const [role, setRole] = useState<Role | null>(search.role ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Hero onSelect={setRole} />
      <RoleCards onSelect={setRole} />
      {role && <DashboardDemo role={role} onChange={setRole} />}
      <Footer />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white shadow-glow">
            <Star className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">ATHENA</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <a href="#dashboards" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboards
          </a>
          <a href="#roles" className="text-sm text-muted-foreground hover:text-foreground">
            Roles
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full bg-accent px-4 text-white hover:bg-accent/90">
            <Link to="/signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   HERO
   ========================================================= */
function Hero({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-16 pb-10 lg:grid-cols-2 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Public Dashboards
          </span>
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Explore ATHENA{" "}
            <span className="text-accent">Dashboards</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Experience the power of ATHENA with interactive demo dashboards
            built for every campus role. No sign-up. No setup. Just click a
            role and start exploring.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <HeroBadge title="Realistic Data" sub="Live demo content" />
            <HeroBadge title="Interactive" sub="Full experience" />
            <HeroBadge title="Role-Based" sub="Tailored for you" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => onSelect("student")}
              className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
            >
              Try Student Demo <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onSelect("admin")}
              className="rounded-full border-border px-5"
            >
              Try Admin Demo
            </Button>
          </div>
        </div>

        <div className="relative">
          <img
            src={campusHero}
            alt="ATHENA 3D isometric smart campus"
            width={1024}
            height={1024}
            className="mx-auto w-full max-w-xl select-none"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-x-0 -bottom-6 mx-auto h-24 w-3/4 rounded-full bg-accent/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

function HeroBadge({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/10 text-accent">
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

/* =========================================================
   ROLE CARDS
   ========================================================= */
const ROLES: {
  id: Role;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "student",
    title: "Student",
    desc: "Access your classes, assignments, attendance and more.",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    id: "faculty",
    title: "Faculty",
    desc: "Manage classes, track performance and engage with students.",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "club",
    title: "Club",
    desc: "Organize events, manage members and track club activities.",
    icon: <Users className="h-6 w-6" />,
  },
  {
    id: "admin",
    title: "Admin",
    desc: "Oversee campus operations, users, reports and system analytics.",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
];

function RoleCards({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <section id="roles" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          Choose Your Role
        </h2>
        <p className="mt-2 text-muted-foreground">
          Select a role to experience the dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              onSelect(r.id);
              setTimeout(
                () =>
                  document
                    .getElementById("dashboards")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                50,
              );
            }}
            className="group relative flex flex-col items-center rounded-[20px] border border-border bg-card p-8 text-center shadow-soft transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-elegant"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent transition-transform group-hover:scale-110">
              {r.icon}
            </span>
            <h3 className="mt-5 text-lg font-bold">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              View Dashboard <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   DASHBOARD SHELL
   ========================================================= */
function DashboardDemo({
  role,
  onChange,
}: {
  role: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <section id="dashboards" className="mx-auto max-w-7xl px-6 pb-24">
      <Tabs value={role} onValueChange={(v) => onChange(v as Role)}>
        <TabsList className="mx-auto grid h-auto w-full max-w-2xl grid-cols-4 rounded-full bg-muted p-1">
          {ROLES.map((r) => (
            <TabsTrigger
              key={r.id}
              value={r.id}
              className="rounded-full py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-accent data-[state=active]:shadow-soft"
            >
              <span className="mr-1.5 hidden sm:inline-block">{r.icon}</span>
              {r.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8 animate-rise-in">
          <TabsContent value="student"><StudentDashboard /></TabsContent>
          <TabsContent value="faculty"><FacultyDashboard /></TabsContent>
          <TabsContent value="club"><ClubDashboard /></TabsContent>
          <TabsContent value="admin"><AdminDashboard /></TabsContent>
        </div>
      </Tabs>
    </section>
  );
}

/* ---------- Shell chrome ---------- */
function DashShell({
  title,
  subtitle,
  user,
  sidebar,
  children,
}: {
  title: string;
  subtitle: string;
  user: { name: string; role: string; initials: string };
  sidebar: { label: string; icon: React.ReactNode; active?: boolean }[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-elegant">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden flex-col justify-between border-r border-border bg-foreground p-4 text-background md:flex">
          <div>
            <div className="mb-8 flex items-center gap-2 px-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-white">
                <Star className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-bold tracking-wider">ATHENA</span>
            </div>
            <nav className="flex flex-col gap-1">
              {sidebar.map((s) => (
                <button
                  key={s.label}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    s.active
                      ? "bg-accent text-white"
                      : "text-background/70 hover:bg-white/5 hover:text-background"
                  }`}
                >
                  <span className="h-4 w-4">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-background/70 hover:bg-white/5">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col">
          {/* Topbar */}
          <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              <h3 className="truncate text-lg font-bold">{title}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="h-9 w-64 rounded-full border-border bg-muted pl-9 text-sm"
                />
              </div>
              <button className="relative rounded-full border border-border p-2 hover:bg-muted">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
              </button>
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-accent text-white text-xs font-semibold">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable pieces ---------- */
function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${
            accent ? "bg-accent text-white" : "bg-muted text-foreground"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: "#111",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
} as const;

/* =========================================================
   STUDENT
   ========================================================= */
function StudentDashboard() {
  const attendance = [
    { d: "Mon", v: 82 },
    { d: "Tue", v: 88 },
    { d: "Wed", v: 91 },
    { d: "Thu", v: 87 },
    { d: "Fri", v: 94 },
    { d: "Sat", v: 90 },
    { d: "Sun", v: 92 },
  ];
  const hours = [
    { d: "Mon", v: 3.2 },
    { d: "Tue", v: 2.4 },
    { d: "Wed", v: 4.1 },
    { d: "Thu", v: 1.8 },
    { d: "Fri", v: 3.6 },
    { d: "Sat", v: 2.9 },
    { d: "Sun", v: 1.2 },
  ];
  return (
    <DashShell
      title="Alex Johnson"
      subtitle="Welcome back,"
      user={{ name: "Alex Johnson", role: "CS · Semester 5", initials: "AJ" }}
      sidebar={[
        { label: "Dashboard", icon: <LayoutDashboard />, active: true },
        { label: "Timetable", icon: <CalendarIcon /> },
        { label: "Events", icon: <Megaphone /> },
        { label: "Messages", icon: <MessageSquare /> },
        { label: "Settings", icon: <Settings /> },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Attendance" value="92%" hint="↑ 2% from last month" icon={<CheckCircle2 className="h-4 w-4" />} accent />
        <StatCard label="CGPA" value="8.67" hint="Top 15% of your batch" icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label="Assignments" value="3" hint="Pending submissions" icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Today's Classes" value="3" hint="Scheduled today" icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Today's Schedule" className="lg:col-span-1">
          <ul className="space-y-3">
            {[
              { t: "09:00 AM", c: "Data Structures", r: "Room 305" },
              { t: "11:00 AM", c: "Operating Systems", r: "Room 210" },
              { t: "02:00 PM", c: "Machine Learning", r: "Room 404" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="w-16 text-xs font-bold text-accent">{x.t}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{x.c}</p>
                  <p className="text-xs text-muted-foreground">{x.r}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Attendance Overview" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendance}>
                <defs>
                  <linearGradient id="stuArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2.5} fill="url(#stuArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Upcoming Events">
          <ul className="space-y-3">
            {[
              { t: "Hackathon 2.0", d: "Tomorrow" },
              { t: "AI Workshop", d: "May 24" },
              { t: "Coding Club Meet", d: "May 27" },
            ].map((e) => (
              <li key={e.t} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-semibold">{e.t}</p>
                  <p className="text-xs text-muted-foreground">{e.d}</p>
                </div>
                <Badge className="bg-accent/10 text-accent hover:bg-accent/10">Join</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Assignment Progress">
          <MiniDonut completed={12} pending={3} overdue={2} />
        </Panel>

        <Panel title="Study Hours This Week">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" fill={ACCENT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Recent Notifications">
        <ul className="divide-y divide-border">
          {[
            { t: "Assignment uploaded: DSA Problem Set", ago: "2h ago" },
            { t: "Attendance marked in Operating Systems", ago: "4h ago" },
            { t: "Exam schedule released", ago: "1d ago" },
          ].map((n) => (
            <li key={n.t} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm">{n.t}</p>
              </div>
              <span className="text-xs text-muted-foreground">{n.ago}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </DashShell>
  );
}

function MiniDonut({
  completed,
  pending,
  overdue,
}: {
  completed: number;
  pending: number;
  overdue: number;
}) {
  const data = [
    { name: "Completed", value: completed, color: ACCENT },
    { name: "Pending", value: pending, color: "#111" },
    { name: "Overdue", value: overdue, color: "#e5e7eb" },
  ];
  const total = completed + pending + overdue;
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-32 w-32">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} innerRadius={44} outerRadius={60} dataKey="value" stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-xl font-black">{pct}%</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="w-20 text-muted-foreground">{d.name}</span>
            <span className="font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================
   FACULTY
   ========================================================= */
function FacultyDashboard() {
  const perf = [
    { d: "W1", a: 72, b: 65 },
    { d: "W2", a: 78, b: 70 },
    { d: "W3", a: 81, b: 74 },
    { d: "W4", a: 85, b: 79 },
    { d: "W5", a: 88, b: 82 },
    { d: "W6", a: 91, b: 86 },
  ];
  return (
    <DashShell
      title="Dr. Sarah Wilson"
      subtitle="Welcome back,"
      user={{ name: "Dr. Sarah Wilson", role: "Professor · CS", initials: "SW" }}
      sidebar={[
        { label: "Dashboard", icon: <LayoutDashboard />, active: true },
        { label: "My Classes", icon: <BookOpen /> },
        { label: "Students", icon: <Users /> },
        { label: "Attendance", icon: <CheckCircle2 /> },
        { label: "Assignments", icon: <ClipboardList /> },
        { label: "Exams", icon: <FileText /> },
        { label: "Announcements", icon: <Megaphone /> },
        { label: "Analytics", icon: <LineChartIcon /> },
      ]}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Classes" value="4" hint="Scheduled today" icon={<Clock className="h-4 w-4" />} accent />
        <StatCard label="Total Students" value="180" hint="Across all classes" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Pending Reviews" value="28" hint="Assignments to grade" icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Attendance Submitted" value="95%" hint="This week" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Class Performance" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perf}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="a" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="b" stroke={INK} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Attendance Overview">
          <MiniDonut completed={80} pending={12} overdue={8} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Recent Submissions" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Student</th>
                <th>Assignment</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["James Anderson", "DSA Assignment", "2h ago"],
                ["Emma Davis", "Algorithm Analysis", "3h ago"],
                ["Michael Brown", "Trees & Graphs", "4h ago"],
                ["Sophia Wilson", "DP Problem Set", "5h ago"],
              ].map(([n, a, t]) => (
                <tr key={n}>
                  <td className="py-3 font-medium">{n}</td>
                  <td className="text-muted-foreground">{a}</td>
                  <td className="text-xs text-muted-foreground">{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Announcements">
          <ul className="space-y-3">
            {[
              { t: "Next Week: Midterm Exam", d: "May 28" },
              { t: "Extra Office Hours", d: "Fri 4pm" },
              { t: "Project Guidelines Update", d: "May 19" },
            ].map((a) => (
              <li key={a.t} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">{a.t}</p>
                <p className="text-xs text-muted-foreground">{a.d}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </DashShell>
  );
}

/* =========================================================
   CLUB
   ========================================================= */
function ClubDashboard() {
  const growth = [
    { d: "Jan", v: 60 },
    { d: "Feb", v: 90 },
    { d: "Mar", v: 140 },
    { d: "Apr", v: 180 },
    { d: "May", v: 220 },
    { d: "Jun", v: 235 },
  ];
  const budget = [
    { name: "Events", value: 60, color: ACCENT },
    { name: "Marketing", value: 20, color: "#111" },
    { name: "Resources", value: 15, color: "#a3a3a3" },
    { name: "Other", value: 5, color: "#e5e7eb" },
  ];
  return (
    <DashShell
      title="Innovation Club"
      subtitle="Building ideas, creating tomorrow."
      user={{ name: "Priya Sharma", role: "Club Lead", initials: "PS" }}
      sidebar={[
        { label: "Dashboard", icon: <LayoutDashboard />, active: true },
        { label: "Members", icon: <Users /> },
        { label: "Events", icon: <CalendarIcon /> },
        { label: "Registrations", icon: <ClipboardList /> },
        { label: "Requests", icon: <FileText /> },
        { label: "Finances", icon: <Wallet /> },
        { label: "Announcements", icon: <Megaphone /> },
        { label: "Messages", icon: <MessageSquare /> },
      ]}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Members" value="235" hint="+18 this month" icon={<Users className="h-4 w-4" />} accent />
        <StatCard label="Upcoming Events" value="4" hint="Next: Hackathon 2.0" icon={<CalendarIcon className="h-4 w-4" />} />
        <StatCard label="Total Budget" value="₹1,20,000" hint="Available balance" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Registrations" value="152" hint="Across all events" icon={<ClipboardList className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Membership Growth" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="clubArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2.5} fill="url(#clubArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Budget Overview">
          <div className="flex items-center gap-3">
            <div className="h-36 w-36">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={budget} innerRadius={44} outerRadius={64} dataKey="value" stroke="none">
                    {budget.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-xs">
              {budget.map((b) => (
                <li key={b.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                    <span className="text-muted-foreground">{b.name}</span>
                  </div>
                  <span className="font-semibold">{b.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Upcoming Events" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {[
              { t: "Hackathon 2.0", d: "May 28", r: 120 },
              { t: "Tech Talk: AI", d: "Jun 3", r: 45 },
              { t: "Web Dev Workshop", d: "Jun 10", r: 30 },
            ].map((e) => (
              <li key={e.t} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold">{e.t}</p>
                  <p className="text-xs text-muted-foreground">{e.d}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{e.r}</p>
                  <p className="text-[10px] text-muted-foreground">Registered</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent Requests">
          <ul className="space-y-3">
            {[
              { t: "Event Approval: Hackathon 2.0", s: "Pending" },
              { t: "Budget Request: Workshop", s: "Approved" },
              { t: "New Membership Drive", s: "Pending" },
            ].map((r) => (
              <li key={r.t} className="flex items-center justify-between rounded-xl border border-border p-3">
                <p className="text-sm">{r.t}</p>
                <Badge
                  className={
                    r.s === "Approved"
                      ? "bg-accent/10 text-accent hover:bg-accent/10"
                      : "bg-muted text-foreground hover:bg-muted"
                  }
                >
                  {r.s}
                </Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </DashShell>
  );
}

/* =========================================================
   ADMIN
   ========================================================= */
function AdminDashboard() {
  const enrol = [
    { d: "Jan", v: 8200 },
    { d: "Feb", v: 8900 },
    { d: "Mar", v: 10200 },
    { d: "Apr", v: 11400 },
    { d: "May", v: 12100 },
    { d: "Jun", v: 12540 },
  ];
  const activity = [
    { d: "Mon", a: 42, b: 30 },
    { d: "Tue", a: 55, b: 38 },
    { d: "Wed", a: 60, b: 45 },
    { d: "Thu", a: 48, b: 40 },
    { d: "Fri", a: 68, b: 52 },
    { d: "Sat", a: 34, b: 28 },
    { d: "Sun", a: 22, b: 18 },
  ];
  return (
    <DashShell
      title="Campus Overview"
      subtitle="Monitor and manage your institution."
      user={{ name: "Rahul Verma", role: "Admin", initials: "RV" }}
      sidebar={[
        { label: "Dashboard", icon: <LayoutDashboard />, active: true },
        { label: "Users", icon: <Users /> },
        { label: "Departments", icon: <Building2 /> },
        { label: "Academics", icon: <BookOpen /> },
        { label: "Clubs", icon: <Briefcase /> },
        { label: "Reports", icon: <FileText /> },
        { label: "System", icon: <Settings /> },
        { label: "Announcements", icon: <Megaphone /> },
      ]}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value="12,540" hint="+320 this month" icon={<GraduationCap className="h-4 w-4" />} accent />
        <StatCard label="Total Faculty" value="421" hint="+12 this month" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Departments" value="18" hint="Active departments" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="System Health" value="99.9%" hint="All systems operational" icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Enrollment Overview" className="lg:col-span-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrol}>
                <defs>
                  <linearGradient id="admArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2.5} fill="url(#admArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Campus Activity" className="lg:col-span-2">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="a" fill={ACCENT} radius={[6, 6, 0, 0]} />
                <Bar dataKey="b" fill={INK} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Department Statistics" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Department</th>
                <th>Students</th>
                <th>Faculty</th>
                <th>Courses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Computer Science", "3,300", "85", "48"],
                ["Electronics", "2,100", "60", "32"],
                ["Mechanical", "1,800", "50", "38"],
                ["Civil", "1,500", "40", "24"],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className="py-3 font-medium">{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Top Performing Clubs">
          <ul className="space-y-3">
            {[
              { t: "Innovation Club", v: 235 },
              { t: "Robotics Club", v: 180 },
              { t: "Coding Club", v: 160 },
              { t: "Entrepreneurship Cell", v: 140 },
            ].map((c) => (
              <li key={c.t}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">{c.t}</span>
                  <span className="text-muted-foreground">{c.v}</span>
                </div>
                <Progress value={(c.v / 235) * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent Alerts">
        <ul className="divide-y divide-border">
          {[
            { t: "Server Load High", ago: "2m ago", tone: "accent" },
            { t: "Database Backup Complete", ago: "1h ago", tone: "muted" },
            { t: "New User Registrations spike", ago: "3h ago", tone: "muted" },
          ].map((a) => (
            <li key={a.t} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${a.tone === "accent" ? "bg-accent" : "bg-muted-foreground/40"}`} />
                <p className="text-sm">{a.t}</p>
              </div>
              <span className="text-xs text-muted-foreground">{a.ago}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </DashShell>
  );
}

/* =========================================================
   FOOTER
   ========================================================= */
function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} ATHENA. All demo data is fictional.</p>
        <Link to="/" className="hover:text-foreground">← Back to home</Link>
      </div>
    </footer>
  );
}

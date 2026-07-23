import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Plus,
  Sparkles,
  Bot,
  Fingerprint,
  FileText,
  CalendarDays,
  ClipboardList,
  Users,
  Briefcase,
  BarChart3,
  GraduationCap,
  ShieldCheck,
  Building2,
  Heart,
  BookOpen,
  FlaskConical,
  UserCog,
  Grid3x3,
  ScanSearch,
  Workflow,
  Bell,
  MessageSquare,
  Cpu,
  Zap,
  KeyRound,
  Lock,
  DatabaseBackup,
  BadgeCheck,
  Cloud,
  Server,
  MapPin,
  Trophy,
  Send,
} from "lucide-react";

import heroCampus from "@/assets/hero-campus.jpg";
import ctaCampus from "@/assets/cta-campus-night.jpg";
import neuralBrain from "@/assets/neural-brain.jpg";
import ecosystemCore from "@/assets/ecosystem-core.jpg";
import momentLecture from "@/assets/moment-lecture.jpg";
import momentAssignment from "@/assets/moment-assignment.jpg";
import momentClub from "@/assets/moment-club.jpg";
import momentAdmin from "@/assets/moment-admin.jpg";
import momentReminder from "@/assets/moment-reminder.jpg";
import dashboards from "@/assets/dashboards.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATHENA — One Campus. Infinite Possibilities." },
      {
        name: "description",
        content:
          "ATHENA is the AI-powered Smart Campus Operating System that unifies students, faculty, clubs, administration, placements and research on one intelligent platform.",
      },
      { property: "og:title", content: "ATHENA — The Intelligent Campus Platform" },
      {
        property: "og:description",
        content:
          "Learn. Connect. Lead. ATHENA unifies every corner of your campus into one AI-first operating system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ATHENA — The Intelligent Campus Platform" },
      {
        name: "twitter:description",
        content:
          "AI-powered campus OS for students, faculty, clubs, placements and administration.",
      },
    ],
  }),
  component: Landing,
});

/* ---------- Reusable atoms ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
      <Plus className="h-3 w-3" strokeWidth={2.5} />
      {children}
    </div>
  );
}

function EyebrowDark({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
      <Plus className="h-3 w-3" strokeWidth={2.5} />
      {children}
    </div>
  );
}

function Star({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
      <path d="M12 6l1 3.4L16 10l-3 .6L12 14l-1-3.4L8 10l3-.6z" opacity=".8" />
    </svg>
  );
}

/* ---------- NAV ---------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Platform", "Solutions", "Resources", "About", "Contact"];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 ${
          scrolled ? "glass rounded-2xl py-2 shadow-soft" : "py-3"
        }`}
      >
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white shadow-glow">
            <Star className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">ATHENA</span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/dashboards">Dashboards</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-accent px-4 text-white shadow-glow hover:bg-accent/90"
          >
            <Link to="/signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  const chips: { label: string; icon: React.ReactNode; pos: string; delay: string }[] = [
    { label: "Classes", icon: <BookOpen className="h-3.5 w-3.5" />, pos: "left-[6%] top-[10%]", delay: "0s" },
    { label: "Assignments", icon: <FileText className="h-3.5 w-3.5" />, pos: "left-[42%] top-[4%]", delay: ".3s" },
    { label: "Events", icon: <CalendarDays className="h-3.5 w-3.5" />, pos: "left-[2%] top-[32%]", delay: ".6s" },
    { label: "Exams", icon: <ClipboardList className="h-3.5 w-3.5" />, pos: "right-[4%] top-[18%]", delay: ".9s" },
    { label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" />, pos: "left-[8%] top-[54%]", delay: "1.2s" },
    { label: "Clubs", icon: <Trophy className="h-3.5 w-3.5" />, pos: "right-[2%] top-[46%]", delay: "1.5s" },
    { label: "Attendance", icon: <Fingerprint className="h-3.5 w-3.5" />, pos: "left-[26%] top-[74%]", delay: "1.8s" },
    { label: "AI Assistant", icon: <Bot className="h-3.5 w-3.5" />, pos: "right-[18%] top-[70%]", delay: "2.1s" },
  ];

  return (
    <section className="relative isolate overflow-hidden pt-32 pb-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Left */}
        <div className="animate-rise-in">
          <Eyebrow>The Intelligent Campus Platform</Eyebrow>

          <h1 className="mt-6 text-[3.4rem] font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-[5.2rem]">
            One Campus.
            <br />
            <span className="text-accent">Infinite</span> Possibilities.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            ATHENA unifies students, faculty, clubs, and administration on one
            intelligent platform to learn, collaborate, and achieve more —
            together.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-accent px-6 text-white shadow-glow hover:bg-accent/90"
            >
              <Link to="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-foreground/15 bg-white px-6"
            >
              <span className="mr-2 grid h-6 w-6 place-items-center rounded-full border border-foreground/20">
                <Play className="h-3 w-3 fill-foreground" />
              </span>
              Explore Platform
            </Button>
          </div>

          <div className="mt-12">
            <div className="text-xs text-muted-foreground">
              Trusted by forward-thinking institutions
            </div>
            <div className="mt-3 flex items-center gap-6 opacity-60">
              {["Meridian", "Northgate", "Ashford", "Kepler", "Vantage"].map((n) => (
                <div key={n} className="flex items-center gap-1.5 text-foreground/70">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                  <span className="text-xs font-semibold tracking-widest">{n.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — 3D isometric campus with floating chips */}
        <div className="relative">
          <div className="relative aspect-square w-full">
            <img
              src={heroCampus}
              alt="ATHENA smart campus isometric render"
              width={1400}
              height={1200}
              className="h-full w-full object-contain"
            />
            {/* Floating chips */}
            {chips.map((c) => (
              <div
                key={c.label}
                className={`absolute ${c.pos} flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold shadow-elegant animate-float-slow`}
                style={{ animationDelay: c.delay }}
              >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-accent/10 text-accent">
                  {c.icon}
                </span>
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- A DAY AT ATHENA ---------- */
function DayAtAthena() {
  const moments = [
    { time: "09:00 AM", title: "Lecture Starts", body: "Students mark attendance instantly.", img: momentLecture },
    { time: "10:30 AM", title: "Assignment Posted", body: "Faculty shares resources and assignments.", img: momentAssignment },
    { time: "12:00 PM", title: "Club Event Announced", body: "Clubs reach the right audience.", img: momentClub },
    { time: "02:00 PM", title: "Admin Approval", body: "Requests verified and approved.", img: momentAdmin },
    { time: "04:30 PM", title: "AI Reminder", body: "Smart nudges keep everyone on track.", img: momentReminder },
  ];
  return (
    <section className="relative bg-[oklch(0.974_0_0)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">
          <div>
            <Eyebrow>A Day at ATHENA</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Your Campus,
              <br />
              <span className="text-accent">Every Moment.</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              From the first lecture to the last event, ATHENA keeps everything
              in sync with everyone, all day, every day.
            </p>
            <Button variant="outline" className="mt-6 rounded-full border-foreground/15 bg-white">
              See How It Works <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="pointer-events-none absolute left-4 right-4 top-3 hidden h-px bg-gradient-to-r from-transparent via-accent to-transparent lg:block" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {moments.map((m, i) => (
                <div
                  key={m.time}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition-all hover:shadow-elegant"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-center justify-between px-3 pt-3">
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">
                      {m.time}
                    </span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="px-3 pt-2">
                    <div className="text-sm font-semibold leading-tight">{m.title}</div>
                    <div className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {m.body}
                    </div>
                  </div>
                  <div className="mt-3 overflow-hidden">
                    <img
                      src={m.img}
                      alt={m.title}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="h-32 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- ECOSYSTEM (dark) ---------- */
function Ecosystem() {
  const nodes = [
    { label: "Research", icon: FlaskConical, pos: "left-[8%] top-[22%]" },
    { label: "Students", icon: GraduationCap, pos: "left-1/2 top-[6%] -translate-x-1/2" },
    { label: "Faculty", icon: UserCog, pos: "right-[8%] top-[22%]" },
    { label: "Clubs & Societies", icon: Users, pos: "left-[4%] top-1/2 -translate-y-1/2" },
    { label: "Administration", icon: ShieldCheck, pos: "right-[4%] top-1/2 -translate-y-1/2" },
    { label: "Library", icon: BookOpen, pos: "left-[10%] bottom-[22%]" },
    { label: "Placement", icon: Briefcase, pos: "left-1/2 bottom-[6%] -translate-x-1/2" },
    { label: "Parents", icon: Heart, pos: "right-[10%] bottom-[22%]" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] py-28 text-white">
      <div className="absolute inset-0 grid-bg-dark opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <EyebrowDark>The ATHENA Ecosystem</EyebrowDark>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Every Role.
              <br />
              <span className="text-accent">One Ecosystem.</span>
            </h2>
            <p className="mt-4 max-w-sm text-white/60">
              A connected ecosystem where every role plays a part in building a
              smarter campus.
            </p>
            <Button className="mt-6 rounded-full bg-white text-black hover:bg-white/90">
              Explore Ecosystem <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="relative h-[520px]">
            <img
              src={ecosystemCore}
              alt=""
              width={1200}
              height={900}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain opacity-90"
            />
            {/* orbit rings */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/25 animate-orbit" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15 animate-orbit-rev" />

            {nodes.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.label}
                  className={`absolute ${n.pos} flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur ring-1 ring-white/10 animate-float-slow`}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/20 text-accent">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {n.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FEATURES BENTO ---------- */
function Features() {
  const items = [
    { icon: Bot, title: "AI Assistant", body: "Your intelligent campus companion." },
    { icon: Fingerprint, title: "Attendance", body: "Smart & accurate tracking." },
    { icon: FileText, title: "Assignments", body: "Create, submit & evaluate." },
    { icon: CalendarDays, title: "Timetable", body: "Personalized class schedules." },
    { icon: ClipboardList, title: "Exams", body: "Online assessments made easy." },
    { icon: Users, title: "Clubs", body: "Build, engage & grow together." },
    { icon: Briefcase, title: "Placements", body: "Prepare, connect, get placed." },
    { icon: BarChart3, title: "Analytics", body: "Data-driven insights for everyone." },
  ];
  return (
    <section id="platform" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <Eyebrow>Everything You Need</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Everything
              <br />
              Happens <span className="text-accent">Here.</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Powerful tools. Seamlessly connected. Built for the way campuses
              work.
            </p>
            <Button variant="outline" className="mt-6 rounded-full border-foreground/15">
              Explore All Features <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.title}
                  className="group rounded-2xl bg-white p-5 shadow-soft ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-elegant"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 text-sm font-semibold">{it.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{it.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- AI SECTION (dark) ---------- */
function AISection() {
  const left = [
    { icon: Grid3x3, label: "Smart Scheduling" },
    { icon: ScanSearch, label: "Anomaly Detection" },
    { icon: Cpu, label: "Resource Allocation" },
    { icon: Sparkles, label: "Predictive Insights" },
  ];
  const right = [
    { icon: Zap, label: "Personalized Recommendations" },
    { icon: Workflow, label: "Automated Workflows" },
    { icon: Bell, label: "Early Alerts & Reminders" },
    { icon: MessageSquare, label: "Natural Language Queries" },
  ];
  return (
    <section id="solutions" className="relative overflow-hidden bg-[#0a0a0a] py-28 text-white">
      <div className="absolute inset-0 grid-bg-dark opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <EyebrowDark>AI That Powers Campus</EyebrowDark>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Intelligence Behind
              <br />
              <span className="text-accent">Every Interaction.</span>
            </h2>
            <p className="mt-4 max-w-sm text-white/60">
              ATHENA AI automates tasks, provides insights, and helps every user
              make smarter decisions.
            </p>
          </div>

          <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="grid grid-cols-1 gap-3">
              {left.map((c) => (
                <AiChip key={c.label} icon={<c.icon className="h-4 w-4" />} label={c.label} />
              ))}
            </div>

            <div className="relative mx-auto h-64 w-64 md:h-80 md:w-80">
              <img src={neuralBrain} alt="" width={800} height={800} loading="lazy" className="h-full w-full object-contain" />
              <div className="pointer-events-none absolute inset-0 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {right.map((c) => (
                <AiChip key={c.label} icon={<c.icon className="h-4 w-4" />} label={c.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AiChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2.5 text-sm font-medium ring-1 ring-white/10 backdrop-blur">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/20 text-accent">
        {icon}
      </span>
      {label}
    </div>
  );
}

/* ---------- DASHBOARDS ---------- */
function Dashboards() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:items-center">
          <div>
            <Eyebrow>Built For Every Role</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Dashboards That
              <br />
              <span className="text-accent">Drive Impact.</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Role-based dashboards with the right information at the right
              time.
            </p>
            <Button variant="outline" className="mt-6 rounded-full border-foreground/15">
              View Dashboards <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <img
              src={dashboards}
              alt="Role-based dashboards for students, faculty, clubs and administration"
              width={1600}
              height={1000}
              loading="lazy"
              className="w-full"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-accent/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- STATS (dark strip) ---------- */
function Stats() {
  const stats = [
    { icon: GraduationCap, value: "12,500+", label: "Students" },
    { icon: UserCog, value: "420+", label: "Faculty" },
    { icon: Trophy, value: "85+", label: "Clubs" },
    { icon: CalendarDays, value: "500+", label: "Events" },
    { icon: MessageSquare, value: "2M+", label: "Messages" },
    { icon: ShieldCheck, value: "99.99%", label: "Uptime" },
  ];
  return (
    <section className="bg-[#0a0a0a] py-14 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-accent ring-1 ring-white/10">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs text-white/60">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- SECURITY ---------- */
function Security() {
  const items = [
    { icon: KeyRound, title: "Role Based Access", body: "Granular permissions for every role." },
    { icon: Lock, title: "End-to-End Encryption", body: "Your data is always protected." },
    { icon: DatabaseBackup, title: "Regular Backups", body: "Never lose what matters." },
    { icon: BadgeCheck, title: "Compliance Ready", body: "Built to meet global standards." },
    { icon: Cloud, title: "Cloud & On-Premise", body: "Flexible deployment options." },
    { icon: Server, title: "Enterprise Grade", body: "Reliable at any scale." },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
          <div>
            <Eyebrow>Secure. Reliable. Trusted.</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Your Data.
              <br />
              Always <span className="text-accent">Protected.</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Enterprise-grade security with role-based access, encryption, and
              compliance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.title} className="text-left">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent/30 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="mt-3 text-sm font-semibold">{it.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{it.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={ctaCampus}
        alt=""
        width={1600}
        height={700}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      <div className="mx-auto max-w-4xl px-6 py-28 text-center text-white">
        <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Ready to <span className="text-accent">Transform</span>
          <br />
          Your Campus?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Join campuses building the future with ATHENA — one intelligent
          platform for every role.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full bg-accent px-6 text-white shadow-glow hover:bg-accent/90">
            <Link to="/signup">Get Started Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
            <Link to="/login">Login</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/40 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
          >
            Request a Demo
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  const cols: { title: string; items: string[] }[] = [
    { title: "Platform", items: ["Overview", "AI Assistant", "Attendance", "Assignments", "Analytics"] },
    { title: "Solutions", items: ["Students", "Faculty", "Clubs", "Administration", "Placements"] },
    { title: "Resources", items: ["Documentation", "Changelog", "Guides", "Security", "Status"] },
    { title: "Company", items: ["About", "Careers", "Press", "Contact", "Partners"] },
  ];
  return (
    <footer id="contact" className="bg-[#0a0a0a] py-16 text-white/80">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
                <Star className="h-4 w-4" />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">ATHENA</span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              The intelligent campus operating system. Learn. Connect. Lead.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-white/50">
              <MapPin className="h-3.5 w-3.5" /> Built for the modern campus.
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold text-white">{c.title}</div>
              <ul className="mt-3 space-y-2 text-sm text-white/60">
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" className="transition hover:text-accent">{i}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} ATHENA. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-accent">Privacy</a>
            <a href="#" className="hover:text-accent">Terms</a>
            <a href="#" className="hover:text-accent">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- PAGE ---------- */
function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <DayAtAthena />
      <Ecosystem />
      <Features />
      <AISection />
      <Dashboards />
      <Stats />
      <Security />
      <FinalCTA />
      <Footer />
    </main>
  );
}

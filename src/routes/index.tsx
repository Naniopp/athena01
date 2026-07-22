import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  Bell,
  MessageSquare,
  BarChart3,
  Users,
  Trophy,
  FolderKanban,
  GraduationCap,
  ShieldCheck,
  Zap,
  Layers,
  Search,
  FileText,
  Mic,
  Send,
  Building2,
  Briefcase,
  FlaskConical,
  Github,
  Twitter,
  Linkedin,
  Bot,
  Radio,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATHENA — Learn. Connect. Lead." },
      {
        name: "description",
        content:
          "ATHENA is the AI-powered campus platform that unifies students, faculty, clubs, and administration into one intelligent operating system.",
      },
      { property: "og:title", content: "ATHENA — The AI Campus Platform" },
      {
        property: "og:description",
        content:
          "One intelligent platform for students, faculty, clubs, and administration. Learn. Connect. Lead.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ATHENA — The AI Campus Platform" },
      {
        name: "twitter:description",
        content:
          "Unify academics, clubs, and administration with an AI-first campus operating system.",
      },
    ],
  }),
  component: Landing,
});

/* ---------- NAV ---------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "AI", href: "#ai" },
    { label: "Community", href: "#community" },
    { label: "Clubs", href: "#clubs" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 ${
          scrolled
            ? "glass-strong rounded-2xl shadow-soft"
            : "bg-transparent"
        }`}
        style={{ paddingBlock: scrolled ? "0.6rem" : "0.75rem" }}
      >
        <a href="#" className="flex items-center gap-2">
          <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-elegant">
            <span className="text-sm font-black text-white">A</span>
            <span className="absolute inset-0 rounded-lg bg-gradient-brand opacity-40 blur-md animate-pulse-glow" />
          </div>
          <span className="text-lg font-bold tracking-tight">ATHENA</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Login
          </Button>
          <Button
            size="sm"
            className="bg-gradient-brand text-white shadow-elegant hover:opacity-90"
          >
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden pt-32">
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary/40 blur-[1px] animate-pulse-glow"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              animationDelay: `${(i % 6) * 0.6}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 lg:grid-cols-2">
        {/* Left */}
        <div className="animate-rise-in">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Campus Platform
          </Badge>

          <h1 className="text-6xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            <span className="text-gradient-brand animate-gradient-x">
              ATHENA
            </span>
          </h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span>Learn.</span>
            <span className="text-primary">Connect.</span>
            <span className="text-secondary">Lead.</span>
          </div>

          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            One intelligent platform that brings students, faculty, clubs, and
            administration together to simplify campus life.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-gradient-brand text-white shadow-elegant hover:opacity-90"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="glass">
              Explore Demo
            </Button>
          </div>
        </div>

        {/* Right — floating UI cards around a central avatar */}
        <div className="relative mx-auto h-[520px] w-full max-w-xl">
          {/* Glow */}
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-brand opacity-30 blur-3xl" />

          {/* Central avatar */}
          <div className="absolute left-1/2 top-1/2 flex h-52 w-52 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-gradient-brand shadow-elegant animate-float-slow">
            <div className="flex h-[calc(100%-14px)] w-[calc(100%-14px)] flex-col items-center justify-center rounded-[calc(1.5rem-4px)] bg-background/95 backdrop-blur">
              <GraduationCap className="h-16 w-16 text-primary" />
              <div className="mt-3 text-sm font-semibold">Campus OS</div>
              <div className="text-xs text-muted-foreground">v1.0</div>
            </div>
          </div>

          <FloatingCard
            className="left-0 top-4 animate-float-slow"
            icon={<Bot className="h-4 w-4" />}
            title="AI Assistant"
            body="How can I help today?"
          />
          <FloatingCard
            className="right-0 top-16 animate-float-slower"
            icon={<CalendarDays className="h-4 w-4" />}
            title="Calendar"
            body="Physics Lab • 2:00 PM"
          />
          <FloatingCard
            className="left-2 top-56 animate-float-slower"
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Attendance"
            body="Marked present — CS301"
            accent="success"
          />
          <FloatingCard
            className="right-2 top-64 animate-float-slow"
            icon={<FileText className="h-4 w-4" />}
            title="Assignments"
            body="3 due this week"
          />
          <FloatingCard
            className="left-8 bottom-4 animate-float-slow"
            icon={<Bell className="h-4 w-4" />}
            title="Notifications"
            body="Robotics Club meets Fri"
          />
          <FloatingCard
            className="right-8 bottom-8 animate-float-slower"
            icon={<BarChart3 className="h-4 w-4" />}
            title="Analytics"
            body="GPA trend • +0.3"
          />
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  className,
  icon,
  title,
  body,
  accent,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: "success";
}) {
  return (
    <div
      className={`absolute w-56 rounded-2xl glass-strong p-3 shadow-soft ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`grid h-7 w-7 place-items-center rounded-lg ${
            accent === "success"
              ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
              : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
        <div className="text-xs font-semibold">{title}</div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{body}</div>
    </div>
  );
}

/* ---------- CONNECTED CAMPUS ---------- */
function Connected() {
  const nodes = [
    { label: "Students", angle: 0, icon: Users },
    { label: "Faculty", angle: 40, icon: GraduationCap },
    { label: "Clubs", angle: 80, icon: Trophy },
    { label: "Admin", angle: 120, icon: ShieldCheck },
    { label: "Events", angle: 160, icon: CalendarDays },
    { label: "Projects", angle: 200, icon: FolderKanban },
    { label: "Research", angle: 240, icon: FlaskConical },
    { label: "Placements", angle: 280, icon: Briefcase },
    { label: "Messages", angle: 320, icon: MessageSquare },
  ];
  const R = 220;
  return (
    <section id="community" className="relative overflow-hidden py-32">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <SectionEyebrow>Connected Campus</SectionEyebrow>
        <h2 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Everything <span className="text-gradient-brand">Connected</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Students, faculty, clubs, and administrators collaborate through one
          intelligent platform.
        </p>

        <div className="relative mx-auto mt-16 h-[560px] w-full max-w-3xl">
          <svg
            viewBox="-300 -300 600 600"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="line" x1="0" x2="1">
                <stop offset="0%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="oklch(0.62 0.22 300)" stopOpacity="0.2" />
              </linearGradient>
              <radialGradient id="core">
                <stop offset="0%" stopColor="oklch(0.62 0.22 300)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="oklch(0.62 0.22 300)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle r="230" fill="url(#core)" />
            {nodes.map((n, i) => {
              const rad = (n.angle * Math.PI) / 180;
              const x = Math.cos(rad) * R;
              const y = Math.sin(rad) * R;
              return (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke="url(#line)"
                  strokeWidth="1.5"
                  className="animate-draw-line"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              );
            })}
          </svg>

          {/* Center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-brand shadow-elegant">
              <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-60 blur-2xl animate-pulse-glow" />
              <div className="relative text-center">
                <div className="text-lg font-black text-white">ATHENA</div>
                <div className="text-[10px] uppercase tracking-widest text-white/80">
                  Core
                </div>
              </div>
            </div>
          </div>

          {/* Node chips */}
          {nodes.map((n, i) => {
            const rad = (n.angle * Math.PI) / 180;
            const x = Math.cos(rad) * R;
            const y = Math.sin(rad) * R;
            const Icon = n.icon;
            return (
              <div
                key={n.label}
                className="absolute flex items-center gap-2 rounded-full glass-strong px-3 py-2 shadow-soft animate-float-slow"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold">{n.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- AI ---------- */
function AISection() {
  const capabilities = [
    "Answer questions",
    "Explain concepts",
    "Manage schedules",
    "Recommend events",
    "Find clubs",
    "Generate reports",
    "Summarize information",
  ];
  return (
    <section id="ai" className="relative py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <SectionEyebrow>AI Assistant</SectionEyebrow>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Meet <span className="text-gradient-brand">Athena AI</span>
          </h2>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Your intelligent campus assistant that helps students, faculty,
            clubs, and administrators complete tasks faster.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2">
            {capabilities.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2 text-sm"
              >
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                {c}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="bg-gradient-brand text-white shadow-elegant hover:opacity-90">
              Try AI
            </Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </div>

        {/* Chat mock */}
        <AIChat />
      </div>
    </section>
  );
}

function AIChat() {
  const [typed, setTyped] = useState("");
  const target =
    "Show me my week: assignments due, next class, and one recommended event.";
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(id);
        setTimeout(() => setTyped(""), 1800);
      }
    }, 45);
    return () => clearInterval(id);
  }, [typed === "" ? 0 : 1]);

  const suggestions = [
    "Summarize today's lecture",
    "Find robotics events",
    "Generate weekly report",
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-brand opacity-20 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl glass-strong shadow-elegant">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold">Athena AI</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)] animate-pulse-glow" />
            Online
          </div>
        </div>

        <div className="space-y-3 px-5 py-6">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
            Hi! I'm Athena. Ask about your classes, clubs, or campus events.
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-brand px-4 py-2.5 text-sm text-white shadow-elegant">
            {typed}
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-white animate-caret" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">
            <div className="mb-2 font-semibold text-foreground">Your week</div>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                2 assignments due — CS301, MA204
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Next: Physics Lab, Wed 2:00 PM
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Recommended: Hackathon Kickoff
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 px-5 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-sm text-muted-foreground">
              Ask Athena anything…
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground">
              <Mic className="h-4 w-4" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-white shadow-elegant">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- FEATURES ---------- */
function Features() {
  const items = [
    { icon: Bot, title: "AI Assistant", desc: "Answers, summaries, and reports on demand." },
    { icon: CheckCircle2, title: "Attendance", desc: "Digital check-ins with trend insights." },
    { icon: FileText, title: "Assignments", desc: "Submit, track, and review effortlessly." },
    { icon: CalendarDays, title: "Events", desc: "Campus-wide events and RSVPs." },
    { icon: Users, title: "Student Community", desc: "A feed for ideas, groups, and discussion." },
    { icon: Trophy, title: "Club Management", desc: "Recruitment, budgets, and posts in one place." },
    { icon: BookOpen, title: "Courses", desc: "Structured content, materials, and grading." },
    { icon: FlaskConical, title: "Research", desc: "Collaborate on projects and publications." },
    { icon: Briefcase, title: "Placements", desc: "Openings, applications, and interviews." },
    { icon: FolderKanban, title: "Projects", desc: "Team boards and milestones." },
    { icon: BarChart3, title: "Analytics", desc: "Insights for every role." },
    { icon: Bell, title: "Smart Notifications", desc: "Priority-aware, never noisy." },
    { icon: CalendarDays, title: "Calendar", desc: "A single unified schedule." },
    { icon: MessageSquare, title: "Messaging", desc: "Direct and group conversations." },
    { icon: Layers, title: "File Sharing", desc: "Organized, searchable, secure." },
    { icon: ShieldCheck, title: "Profile Management", desc: "One identity across campus." },
  ];
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Features</SectionEyebrow>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Everything You <span className="text-gradient-brand">Need</span>.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete toolkit designed for real campus workflows.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 shadow-soft backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant"
              >
                <div className="absolute inset-x-0 -top-24 -z-10 h-40 bg-gradient-brand opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25" />
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-white shadow-elegant">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- DASHBOARDS ---------- */
function Dashboards() {
  return (
    <section id="clubs" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Dashboards</SectionEyebrow>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Built for <span className="text-gradient-brand">Every Role</span>.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tailored experiences for students, faculty, clubs, and administrators.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardMock
            role="Student"
            accent="from-primary to-accent"
            widgets={
              <>
                <MockCard title="Today's Classes">
                  <MockRow label="CS 301 — Algorithms" right="9:00 AM" />
                  <MockRow label="MA 204 — Statistics" right="11:00 AM" />
                  <MockRow label="Physics Lab" right="2:00 PM" />
                </MockCard>
                <MockCard title="GPA Trend">
                  <MiniChart />
                </MockCard>
                <MockCard title="Assignments">
                  <MockProgress label="ML Project" value={78} />
                  <MockProgress label="Lab Report" value={40} />
                  <MockProgress label="Essay" value={92} />
                </MockCard>
              </>
            }
          />
          <DashboardMock
            role="Faculty"
            accent="from-secondary to-accent"
            widgets={
              <>
                <MockCard title="Attendance — CS 301">
                  <div className="flex items-end gap-1 h-16">
                    {[60, 72, 65, 80, 74, 88, 92].map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-brand"
                        style={{ height: `${v}%` }}
                      />
                    ))}
                  </div>
                </MockCard>
                <MockCard title="Pending Reviews">
                  <MockRow label="42 submissions" right="Grade" />
                  <MockRow label="8 research drafts" right="Review" />
                </MockCard>
                <MockCard title="Announcements">
                  <MockRow label="Midterm rescheduled" right="Sent" />
                  <MockRow label="Guest lecture Fri" right="Draft" />
                </MockCard>
              </>
            }
          />
          <DashboardMock
            role="Club"
            accent="from-accent to-primary"
            widgets={
              <>
                <MockCard title="Upcoming Event">
                  <div className="flex items-center justify-between rounded-lg bg-gradient-brand p-3 text-white">
                    <div>
                      <div className="text-xs opacity-80">Fri • 6 PM</div>
                      <div className="font-semibold">Hackathon Kickoff</div>
                    </div>
                    <Trophy className="h-6 w-6" />
                  </div>
                </MockCard>
                <MockCard title="Members">
                  <MockRow label="Total" right="128" />
                  <MockRow label="New this month" right="+14" />
                  <MockRow label="Active" right="96%" />
                </MockCard>
                <MockCard title="Budget">
                  <MockProgress label="Allocated" value={65} />
                </MockCard>
              </>
            }
          />
          <DashboardMock
            role="Admin"
            accent="from-primary to-secondary"
            widgets={
              <>
                <MockCard title="System Health">
                  <div className="grid grid-cols-3 gap-2">
                    <Kpi label="Users" value="Active" />
                    <Kpi label="Courses" value="Live" />
                    <Kpi label="Uptime" value="Stable" />
                  </div>
                </MockCard>
                <MockCard title="Approvals">
                  <MockRow label="Event proposals" right="Review" />
                  <MockRow label="Club charters" right="Review" />
                </MockCard>
                <MockCard title="Departments">
                  <MockRow label="Engineering" right={<Building2 className="h-4 w-4" />} />
                  <MockRow label="Sciences" right={<Building2 className="h-4 w-4" />} />
                  <MockRow label="Arts" right={<Building2 className="h-4 w-4" />} />
                </MockCard>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}

function DashboardMock({
  role,
  widgets,
  accent,
}: {
  role: string;
  widgets: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-1.5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${accent} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`}
      />
      <div className="rounded-[calc(1.5rem-6px)] bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-warning)]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-success)]/80" />
            </div>
            <div className="ml-3 text-xs text-muted-foreground">
              athena.app / {role.toLowerCase()}
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {role} Dashboard
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">{widgets}</div>
      </div>
    </div>
  );
}

function MockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
function MockRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md px-1 py-1">
      <span className="truncate text-xs">{label}</span>
      <span className="text-xs text-muted-foreground">{right}</span>
    </div>
  );
}
function MockProgress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-brand"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  );
}
function MiniChart() {
  const pts = [10, 18, 14, 22, 20, 28, 32, 30, 38];
  const max = 40;
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * 100} ${40 - (p / max) * 36}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full">
      <defs>
        <linearGradient id="mc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100 40 L 0 40 Z`} fill="url(#mc)" />
      <path d={path} fill="none" stroke="oklch(0.58 0.22 285)" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- HOW IT WORKS ---------- */
function HowItWorks() {
  const steps = [
    { title: "Create Account", icon: Sparkles },
    { title: "Join Your Institution", icon: Building2 },
    { title: "Access Dashboard", icon: Layers },
    { title: "Collaborate", icon: Users },
    { title: "Learn", icon: BookOpen },
    { title: "Lead", icon: Trophy },
  ];
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            From sign-up to <span className="text-gradient-brand">leading</span>.
          </h2>
        </div>

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-elegant">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {i + 1}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{s.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- PLATFORM HIGHLIGHTS ---------- */
function Highlights() {
  const items = [
    { icon: Bot, title: "AI-Powered Assistance" },
    { icon: Radio, title: "Unified Campus Communication" },
    { icon: Layers, title: "Role-Based Dashboards" },
    { icon: ShieldCheck, title: "Secure Authentication" },
    { icon: BarChart3, title: "Smart Analytics" },
    { icon: Sparkles, title: "Modern User Experience" },
    { icon: Zap, title: "Scalable Architecture" },
    { icon: Bell, title: "Real-Time Notifications" },
  ];
  return (
    <section id="about" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Platform Highlights</SectionEyebrow>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            What makes ATHENA <span className="text-gradient-brand">different</span>.
          </h2>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-brand group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{h.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const qs = [
    {
      q: "What is ATHENA?",
      a: "ATHENA is an AI-first campus operating system that unifies academics, clubs, communication, and administration in a single intelligent platform.",
    },
    {
      q: "Who can use ATHENA?",
      a: "Students, faculty, clubs, and administrators each get a dedicated, role-based experience designed for their workflows.",
    },
    {
      q: "How does Athena AI help?",
      a: "Athena AI answers questions, summarizes content, manages schedules, recommends events and clubs, and generates reports — for every role.",
    },
    {
      q: "Can clubs manage events?",
      a: "Yes. Clubs can handle recruitment, events, budgets, sponsors, gallery, posts, and analytics from a unified dashboard.",
    },
    {
      q: "Is the platform secure?",
      a: "ATHENA uses secure authentication, role-based access control, and modern best practices to keep campus data safe.",
    },
    {
      q: "How do I get started?",
      a: "Create an account, join your institution, and access your role-based dashboard. That’s it.",
    },
  ];
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently asked <span className="text-gradient-brand">questions</span>.
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-12 w-full">
          {qs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="mb-3 overflow-hidden rounded-2xl border border-border/60 bg-card/50 px-5 shadow-soft"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <section id="contact" className="relative overflow-hidden py-32">
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary/40 animate-pulse-glow"
            style={{
              top: `${(i * 41) % 100}%`,
              left: `${(i * 67) % 100}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              animationDelay: `${(i % 5) * 0.5}s`,
            }}
          />
        ))}
      </div>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="relative mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand shadow-elegant">
          <GraduationCap className="h-10 w-10 text-white" />
          <div className="absolute inset-0 rounded-3xl bg-gradient-brand opacity-50 blur-2xl animate-pulse-glow" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Ready to build a{" "}
          <span className="text-gradient-brand">smarter campus</span>?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Experience a unified campus platform designed for the future of
          education.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            className="bg-gradient-brand text-white shadow-elegant hover:opacity-90"
          >
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="glass">
            Request Demo
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  const cols = [
    {
      title: "Product",
      items: ["Features", "AI", "Community"],
    },
    {
      title: "Resources",
      items: ["Documentation", "Support", "Privacy Policy", "Terms & Conditions"],
    },
    {
      title: "Company",
      items: ["About", "Contact", "GitHub"],
    },
  ];
  return (
    <footer className="border-t border-border/60 bg-card/30 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-white">
                <span className="text-sm font-black">A</span>
              </div>
              <div className="text-lg font-bold">ATHENA</div>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The intelligent operating system for modern campuses.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Github, Twitter, Linkedin].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" className="inline-flex items-center gap-1 hover:text-foreground">
                      {i}
                      <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} ATHENA. All rights reserved.</div>
          <div>Learn. Connect. Lead.</div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- HELPERS ---------- */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
      <Sparkles className="h-3 w-3" />
      {children}
    </div>
  );
}

/* ---------- PAGE ---------- */
function Landing() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Connected />
      <AISection />
      <Features />
      <Dashboards />
      <HowItWorks />
      <Highlights />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

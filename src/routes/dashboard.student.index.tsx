import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Home, Bot, BookOpen, ClipboardList, CheckCircle2, Calendar as CalendarIcon,
  MessageSquare, Drama, PartyPopper, Library, Briefcase, FlaskConical, Trophy,
  User, Settings, LogOut, Search, Plus, Bell, Moon, Sun, Image as ImageIcon,
  BarChart3, Megaphone, Heart, MessageCircle, Share2, Bookmark, Menu, X,
  Sparkles, ChevronRight, TrendingUp, Award, Zap, ArrowUpRight, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/student/")({
  component: StudentDashboard,
  head: () => ({
    meta: [
      { title: "Campus Feed · ATHENA" },
      { name: "description", content: "Your live campus feed — announcements, assignments, clubs, placements, and AI insights, all in one premium student workspace." },
      { property: "og:title", content: "Campus Feed · ATHENA" },
      { property: "og:description", content: "The digital heartbeat of your university." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ---------------- Data ---------------- */

const NAV = [
  { icon: Home, label: "Home", key: "home" },
  { icon: Bot, label: "Athena AI", key: "ai" },
  { icon: BookOpen, label: "My Courses", key: "courses" },
  { icon: ClipboardList, label: "Assignments", key: "assignments" },
  { icon: CheckCircle2, label: "Attendance", key: "attendance" },
  { icon: CalendarIcon, label: "Calendar", key: "calendar" },
  { icon: MessageSquare, label: "Messages", key: "messages" },
  { icon: Drama, label: "Clubs", key: "clubs" },
  { icon: PartyPopper, label: "Events", key: "events" },
  { icon: Library, label: "Library", key: "library" },
  { icon: Briefcase, label: "Placements", key: "placements" },
  { icon: FlaskConical, label: "Research", key: "research" },
  { icon: Trophy, label: "Achievements", key: "achievements" },
  { icon: User, label: "Profile", key: "profile" },
  { icon: Settings, label: "Settings", key: "settings" },
];

const CATEGORIES = ["All", "Announcements", "Academics", "Assignments", "Clubs", "Placements", "Research", "Events"] as const;
type Category = (typeof CATEGORIES)[number];

type Post = {
  id: string;
  author: string;
  role: string;
  roleColor?: string;
  avatar: string;
  time: string;
  category: Exclude<Category, "All">;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  saved?: boolean;
};

const POSTS: Post[] = [
  {
    id: "1",
    author: "Dr. Priya Menon",
    role: "Faculty · CSE",
    avatar: "PM",
    time: "12m",
    category: "Announcements",
    content:
      "Reminder — Machine Learning midterm has moved to Friday, 10:00 AM in LH-204. Syllabus locked at Chapter 7. Office hours extended this Wednesday for revisions. Bring your questions, not your caffeine crashes ☕",
    likes: 214, comments: 38, shares: 12,
  },
  {
    id: "2",
    author: "Assignments · DBMS",
    role: "Course Bot",
    avatar: "DB",
    time: "42m",
    category: "Assignments",
    content:
      "New assignment posted: Normalization Case Study (3NF → BCNF). Due Aug 3, 11:59 PM. Auto-graded rubric attached. Late submissions accept up to 24h with 10% penalty.",
    likes: 88, comments: 21, shares: 5,
  },
  {
    id: "3",
    author: "ACM Student Chapter",
    role: "Club · Verified",
    avatar: "AC",
    time: "1h",
    category: "Clubs",
    content:
      "🎉 CodeStorm 5.0 registrations are LIVE. 36-hour hackathon, ₹2L prize pool, mentors from Razorpay, Zerodha, and Postman. First 100 teams get free swag kits.",
    image: "grid",
    likes: 1240, comments: 187, shares: 96,
  },
  {
    id: "4",
    author: "Placement Cell",
    role: "Official",
    avatar: "PC",
    time: "2h",
    category: "Placements",
    content:
      "Stripe is on campus Sept 12 for SDE-1 (2026 batch). CGPA cutoff 7.5, no active backlogs. Applications close midnight Sunday. Preparation kit and past interview transcripts pinned in resources.",
    likes: 902, comments: 143, shares: 210,
  },
  {
    id: "5",
    author: "Aditi Rao",
    role: "Student · Final Year",
    avatar: "AR",
    time: "3h",
    category: "Research",
    content:
      "Our paper on Federated Learning for edge devices got accepted at NeurIPS Workshop 🎓 Huge thanks to Prof. Iyer and the lab. AMA below — happy to share the submission playbook.",
    likes: 1876, comments: 244, shares: 128,
  },
  {
    id: "6",
    author: "Sports Council",
    role: "Announcement",
    avatar: "SC",
    time: "5h",
    category: "Events",
    content:
      "Inter-department football finals — Saturday, 5 PM at Ground A. CSE vs ECE. Free entry, cheer squads welcome. Live commentary on ATHENA Radio.",
    likes: 431, comments: 62, shares: 24,
  },
  {
    id: "7",
    author: "Campus Library",
    role: "Notice",
    avatar: "CL",
    time: "8h",
    category: "Announcements",
    content:
      "Extended hours during midterms — Central Library open 24×7 from Aug 1–10. Silent Zone bookings live on ATHENA. Coffee counter reopens tomorrow ☕",
    likes: 156, comments: 12, shares: 8,
  },
  {
    id: "8",
    author: "Rohan Shetty",
    role: "Student · Achiever",
    avatar: "RS",
    time: "11h",
    category: "Academics",
    content:
      "Won 2nd place at IIT-B's national quiz meet last weekend 🏆 Grateful to the college for the travel grant. Notes and prep sheet dropping in the Achievers channel tonight.",
    likes: 2103, comments: 312, shares: 88,
  },
];

const CLASSES = [
  { time: "9:00", title: "Machine Learning", room: "LH-204", accent: true },
  { time: "11:00", title: "Database Systems", room: "LH-118" },
  { time: "2:00", title: "Software Engineering Lab", room: "Lab-3" },
];

const NOTIFS = [
  { icon: ClipboardList, title: "Assignment uploaded", meta: "DBMS · Normalization", time: "12m" },
  { icon: CheckCircle2, title: "Attendance updated", meta: "ML — 82%", time: "1h" },
  { icon: CalendarIcon, title: "Exam schedule released", meta: "Midterms Aug 5", time: "3h" },
  { icon: Drama, title: "Club invitation", meta: "Robotics Society", time: "6h" },
  { icon: Briefcase, title: "Placement drive", meta: "Stripe · SDE-1", time: "1d" },
];

const AI_SUGGESTIONS = [
  { icon: ClipboardList, text: "Assignment due tomorrow — DBMS Normalization" },
  { icon: TrendingUp, text: "Attendance in ML is trending below 75%" },
  { icon: Sparkles, text: "AI Workshop on Aug 2 matches your interests" },
  { icon: Briefcase, text: "4 placement applications open this week" },
];

const QUICK = [
  { icon: ClipboardList, label: "Submit Assignment" },
  { icon: Library, label: "Book Library" },
  { icon: PartyPopper, label: "Join Event" },
  { icon: CheckCircle2, label: "View Attendance" },
  { icon: Bot, label: "Ask Athena" },
];

const UPCOMING = [
  { name: "CodeStorm Hackathon", date: "Aug 2 · 9AM", tag: "Hackathon" },
  { name: "Generative AI Workshop", date: "Aug 4 · 3PM", tag: "Workshop" },
  { name: "Sports Fest — Opening", date: "Aug 6 · 5PM", tag: "Sports" },
  { name: "LeetCode Contest", date: "Aug 8 · 8PM", tag: "Coding" },
  { name: "Research Symposium", date: "Aug 10 · 10AM", tag: "Research" },
];

/* ---------------- Small UI atoms ---------------- */

function Avatar({ text, size = 40, accent = false }: { text: string; size?: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-full grid place-items-center font-semibold shrink-0 select-none",
        accent ? "bg-[#F97316] text-white" : "bg-[#111111] text-white",
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {text}
    </div>
  );
}

function IconBtn({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 w-10 grid place-items-center rounded-full transition-all",
        "hover:bg-[#FFF7ED] hover:text-[#F97316] active:scale-95",
        active && "bg-[#FFF7ED] text-[#F97316]",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Sidebar ---------------- */

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState("home");
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[260px] bg-white border-r border-[#E5E7EB]",
          "flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E5E7EB]">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#111111] grid place-items-center">
              <div className="h-3 w-3 rounded-sm bg-[#F97316]" />
            </div>
            <span className="font-bold tracking-tight text-[#111111]">ATHENA</span>
          </Link>
          <button className="lg:hidden text-[#6B7280]" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map((n) => {
            const isActive = active === n.key;
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                onClick={() => setActive(n.key)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#FFF7ED] text-[#F97316]"
                    : "text-[#111111] hover:bg-[#F8F8F8]",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#F97316]" />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#E5E7EB]">
          <Link
            to="/login"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F8F8F8] hover:text-[#111111]"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </Link>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Top bar ---------------- */

function TopBar({ onMenu, dark, setDark }: { onMenu: () => void; dark: boolean; setDark: (v: boolean) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB]">
      <div className="h-16 px-4 lg:px-8 flex items-center gap-4">
        <button className="lg:hidden text-[#111111]" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </button>

        <div className={cn(
          "flex items-center gap-2 rounded-full bg-[#F8F8F8] border border-transparent px-4 h-10 transition-all",
          focused ? "w-full max-w-md border-[#F97316]/40 bg-white shadow-sm" : "w-full max-w-xs",
        )}>
          <Search className="h-4 w-4 text-[#6B7280]" />
          <input
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search anything..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-[#6B7280]"
          />
        </div>

        <h1 className="hidden md:block flex-1 text-center font-semibold text-[#111111] tracking-tight">
          Campus Feed
        </h1>

        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <button className="hidden sm:flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-[#F97316] transition-colors">
            <Plus className="h-4 w-4" /> Create
          </button>
          <IconBtn><MessageSquare className="h-[18px] w-[18px]" /></IconBtn>
          <div className="relative">
            <IconBtn><Bell className="h-[18px] w-[18px]" /></IconBtn>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F97316] ring-2 ring-white" />
          </div>
          <IconBtn onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </IconBtn>
          <button className="ml-1"><Avatar text="AJ" size={36} /></button>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Composer ---------------- */

function Composer() {
  return (
    <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(17,17,17,0.04)] p-5">
      <div className="flex items-center gap-3">
        <Avatar text="AJ" size={44} />
        <input
          placeholder="Share something with your campus..."
          className="flex-1 h-11 px-4 rounded-full bg-[#F8F8F8] text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316]/30 transition-all placeholder:text-[#6B7280]"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {[
          { icon: ImageIcon, label: "Photo" },
          { icon: BarChart3, label: "Poll" },
          { icon: CalendarIcon, label: "Event" },
          { icon: Megaphone, label: "Announcement" },
        ].map((b) => (
          <button
            key={b.label}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full text-sm text-[#6B7280] hover:bg-[#FFF7ED] hover:text-[#F97316] transition-colors"
          >
            <b.icon className="h-4 w-4" /> {b.label}
          </button>
        ))}
        <button className="ml-auto h-9 px-4 rounded-full bg-[#F97316] text-white text-sm font-medium hover:brightness-95 active:scale-[0.98] transition">
          Create Post
        </button>
      </div>
    </div>
  );
}

/* ---------------- Post Card ---------------- */

function PostImagePlaceholder() {
  return (
    <div className="mt-4 h-56 rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#111111] to-[#333]">
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.5), transparent 40%), radial-gradient(circle at 80% 60%, rgba(249,115,22,0.35), transparent 45%)",
        }}
      />
      <div className="absolute inset-0 grid-bg-dark opacity-30" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        <div className="text-xs uppercase tracking-widest text-[#F97316] font-semibold">CodeStorm 5.0</div>
        <div className="text-2xl font-bold mt-1">36 Hours. Infinite Ideas.</div>
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [saved, setSaved] = useState(!!post.saved);
  const [likes, setLikes] = useState(post.likes);
  const [beat, setBeat] = useState(false);

  const toggleLike = () => {
    setLiked((v) => {
      const nv = !v;
      setLikes((n) => n + (nv ? 1 : -1));
      if (nv) { setBeat(true); setTimeout(() => setBeat(false), 400); }
      return nv;
    });
  };

  return (
    <article
      className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(17,17,17,0.04)] hover:shadow-[0_8px_30px_rgba(17,17,17,0.06)] transition-shadow p-5 animate-rise-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <header className="flex items-center gap-3">
        <Avatar text={post.avatar} accent={post.role.toLowerCase().includes("club") || post.role.toLowerCase().includes("bot")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#111111] truncate">{post.author}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#F97316]">
              {post.role}
            </span>
          </div>
          <div className="text-xs text-[#6B7280] mt-0.5">{post.time} ago · {post.category}</div>
        </div>
        <button className="text-[#6B7280] hover:text-[#111111]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <p className="mt-4 text-[15px] leading-relaxed text-[#111111]">{post.content}</p>

      {post.image && <PostImagePlaceholder />}

      <footer className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-sm text-[#6B7280]">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLike}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-full transition-colors",
              liked ? "text-[#F97316] bg-[#FFF7ED]" : "hover:bg-[#F8F8F8]",
            )}
          >
            <Heart className={cn("h-[18px] w-[18px] transition-transform", liked && "fill-[#F97316]", beat && "scale-125")} />
            <span className="tabular-nums">{likes.toLocaleString()}</span>
          </button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-[#F8F8F8]">
            <MessageCircle className="h-[18px] w-[18px]" />
            <span>{post.comments}</span>
          </button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-[#F8F8F8]">
            <Share2 className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">{post.shares}</span>
          </button>
        </div>
        <button
          onClick={() => setSaved((v) => !v)}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-full transition-all active:scale-90",
            saved ? "text-[#F97316] bg-[#FFF7ED]" : "hover:bg-[#F8F8F8]",
          )}
        >
          <Bookmark className={cn("h-[18px] w-[18px]", saved && "fill-[#F97316]")} />
        </button>
      </footer>
    </article>
  );
}

/* ---------------- Right rail widgets ---------------- */

function Widget({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#111111]">{title}</h3>
        {action && <button className="text-xs font-medium text-[#F97316] hover:underline">{action}</button>}
      </div>
      {children}
    </div>
  );
}

function ProfileCard() {
  return (
    <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-[#111111] to-[#2a2a2a]" />
      <div className="relative flex items-end gap-3">
        <div className="h-16 w-16 rounded-full bg-white p-1 shadow-md">
          <Avatar text="AJ" size={56} accent />
        </div>
        <div className="pb-1">
          <div className="font-semibold text-[#111111]">Alex Johnson</div>
          <div className="text-xs text-[#6B7280]">Computer Science · Sem 5</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "CGPA", value: "9.1" },
          { label: "Attend.", value: "88%" },
          { label: "Badges", value: "12" },
        ].map((s) => (
          <div key={s.label} className="bg-[#F8F8F8] rounded-xl py-2.5">
            <div className="text-base font-bold text-[#111111]">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-[#6B7280] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full h-10 rounded-full border border-[#E5E7EB] text-sm font-medium text-[#111111] hover:bg-[#F8F8F8] transition">
        View Profile
      </button>
    </div>
  );
}

function AthenaAICard() {
  return (
    <div className="rounded-[20px] p-5 relative overflow-hidden bg-[#111111] text-white shadow-[0_10px_30px_rgba(17,17,17,0.15)]">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#F97316]/30 blur-3xl animate-pulse-glow" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#F97316] font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Athena AI
        </div>
        <div className="mt-2 text-lg font-semibold">Good Morning, Alex 👋</div>
        <p className="text-sm text-white/70 mt-1">Here's what needs your attention today.</p>

        <div className="mt-4 space-y-2">
          {AI_SUGGESTIONS.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-3 py-2.5">
              <s.icon className="h-4 w-4 text-[#F97316] mt-0.5 shrink-0" />
              <span className="text-white/90">{s.text}</span>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full h-10 rounded-full bg-[#F97316] text-white text-sm font-semibold hover:brightness-95 active:scale-[0.98] transition flex items-center justify-center gap-1.5">
          Open Athena AI <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Main ---------------- */

function StudentDashboard() {
  const [category, setCategory] = useState<Category>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(6);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (category === "All" ? POSTS : POSTS.filter((p) => p.category === category)),
    [category],
  );

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible((v) => Math.min(v + 3, filtered.length));
    }, { rootMargin: "200px" });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [filtered.length]);

  useEffect(() => { setVisible(6); }, [category]);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 min-w-0">
          <TopBar onMenu={() => setSidebarOpen(true)} dark={dark} setDark={setDark} />

          <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
            {/* Center */}
            <main className="min-w-0 space-y-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Campus Feed</h2>
                <p className="text-sm text-[#6B7280] mt-1">The live pulse of your university, in one place.</p>
              </div>

              {/* Category tabs */}
              <div className="flex gap-1 overflow-x-auto -mx-4 px-4 border-b border-[#E5E7EB] scrollbar-hide">
                {CATEGORIES.map((c) => {
                  const active = c === category;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                        active ? "text-[#111111]" : "text-[#6B7280] hover:text-[#111111]",
                      )}
                    >
                      {c}
                      {active && (
                        <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-[#F97316]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Composer />

              <div className="space-y-4">
                {filtered.slice(0, visible).map((p, i) => (
                  <PostCard key={p.id} post={p} index={i} />
                ))}
              </div>

              {visible < filtered.length && (
                <div ref={sentinelRef} className="h-12 grid place-items-center text-sm text-[#6B7280]">
                  Loading more…
                </div>
              )}
              {visible >= filtered.length && filtered.length > 3 && (
                <div className="h-12 grid place-items-center text-xs text-[#6B7280]">
                  You're all caught up ✨
                </div>
              )}
            </main>

            {/* Right rail */}
            <aside className="hidden xl:block space-y-5">
              <div className="sticky top-24 space-y-5">
                <AthenaAICard />

                <Widget title="Today's Schedule" action="Calendar">
                  <ol className="space-y-1">
                    {CLASSES.map((c, i) => (
                      <li key={i} className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                        c.accent ? "bg-[#FFF7ED]" : "hover:bg-[#F8F8F8]",
                      )}>
                        <div className={cn(
                          "text-xs font-bold tabular-nums w-10 shrink-0",
                          c.accent ? "text-[#F97316]" : "text-[#111111]",
                        )}>{c.time}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[#111111] truncate">{c.title}</div>
                          <div className="text-xs text-[#6B7280]">{c.room}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                      </li>
                    ))}
                  </ol>
                </Widget>

                <Widget title="Recent Updates" action="See all">
                  <ul className="space-y-3">
                    {NOTIFS.map((n, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#F8F8F8] grid place-items-center shrink-0">
                          <n.icon className="h-4 w-4 text-[#F97316]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[#111111] truncate">{n.title}</div>
                          <div className="text-xs text-[#6B7280] truncate">{n.meta} · {n.time}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Widget>

                <Widget title="Quick Actions">
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK.map((q) => (
                      <button
                        key={q.label}
                        className="flex items-center gap-2 h-11 px-3 rounded-xl bg-[#F8F8F8] hover:bg-[#FFF7ED] hover:text-[#F97316] text-sm font-medium text-[#111111] transition-all text-left"
                      >
                        <q.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{q.label}</span>
                      </button>
                    ))}
                  </div>
                </Widget>

                <Widget title="Upcoming Events" action="Explore">
                  <ul className="space-y-2.5">
                    {UPCOMING.map((e, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#F8F8F8] transition-colors">
                        <div className="h-10 w-10 rounded-xl bg-[#111111] text-white grid place-items-center shrink-0">
                          <PartyPopper className="h-4 w-4 text-[#F97316]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[#111111] truncate">{e.name}</div>
                          <div className="text-xs text-[#6B7280]">{e.date}</div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#F97316] px-2 py-1 rounded-full bg-[#FFF7ED]">{e.tag}</span>
                      </li>
                    ))}
                  </ul>
                </Widget>

                <ProfileCard />
              </div>
            </aside>
          </div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-[#E5E7EB] flex justify-around py-2">
            {[
              { icon: Home, label: "Feed" },
              { icon: Bot, label: "AI" },
              { icon: Plus, label: "Post", primary: true },
              { icon: Bell, label: "Alerts" },
              { icon: User, label: "Me" },
            ].map((t, i) => (
              <button key={i} className={cn(
                "flex flex-col items-center gap-1 flex-1 text-[10px] font-medium",
                t.primary ? "text-[#F97316]" : "text-[#6B7280]",
              )}>
                <div className={cn(
                  "h-10 w-10 grid place-items-center rounded-full",
                  t.primary && "bg-[#F97316] text-white",
                )}>
                  <t.icon className="h-5 w-5" />
                </div>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="h-20 lg:hidden" />
        </div>
      </div>
    </div>
  );
}

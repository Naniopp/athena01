import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home, Bot, BookOpen, FileText, CheckSquare, Calendar, MessageSquare, Users, PartyPopper,
  Library, Briefcase, FlaskConical, Trophy, User, Settings as SettingsIcon, LogOut, Search,
  Bell, Plus, Moon, Sun, Menu, X, WifiOff, Check, Trash2, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCampus, useHydrated } from "@/lib/campus/store";
import {
  seedCourses, seedAssignments, seedEvents, seedClubs, seedBooks, seedJobs, seedPapers,
} from "@/lib/campus/seed";
import { Btn, Skeleton, timeAgo } from "./ui";

const R = "/dashboard/student";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };

export const NAV: NavItem[] = [
  { to: R, label: "Home", icon: Home, exact: true },
  { to: `${R}/ai`, label: "Athena AI", icon: Bot },
  { to: `${R}/courses`, label: "My Courses", icon: BookOpen },
  { to: `${R}/assignments`, label: "Assignments", icon: FileText },
  { to: `${R}/attendance`, label: "Attendance", icon: CheckSquare },
  { to: `${R}/calendar`, label: "Calendar", icon: Calendar },
  { to: `${R}/messages`, label: "Messages", icon: MessageSquare },
  { to: `${R}/clubs`, label: "Clubs", icon: Users },
  { to: `${R}/events`, label: "Events", icon: PartyPopper },
  { to: `${R}/library`, label: "Library", icon: Library },
  { to: `${R}/placements`, label: "Placements", icon: Briefcase },
  { to: `${R}/research`, label: "Research", icon: FlaskConical },
  { to: `${R}/achievements`, label: "Achievements", icon: Trophy },
  { to: `${R}/profile`, label: "Profile", icon: User },
  { to: `${R}/settings`, label: "Settings", icon: SettingsIcon },
];

const MOBILE_NAV = [NAV[0], NAV[2], NAV[3], NAV[6], NAV[13]];

function useTheme() {
  const theme = useCampus((s) => s.settings.theme);
  const largeText = useCampus((s) => s.settings.largeText);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.fontSize = largeText ? "17px" : "";
  }, [theme, largeText]);
}

function useOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return offline;
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const posts = useCampus((s) => s.posts);
  const conversations = useCampus((s) => s.conversations);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);


  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const hit = (s: string) => s.toLowerCase().includes(t);
    const out: { group: string; label: string; sub: string; to: string }[] = [];
    seedCourses.filter((c) => hit(c.title) || hit(c.code)).forEach((c) => out.push({ group: "Courses", label: `${c.code} · ${c.title}`, sub: c.faculty, to: `${R}/courses?q=${encodeURIComponent(c.code)}` }));
    seedCourses.filter((c) => hit(c.faculty)).forEach((c) => out.push({ group: "Faculty", label: c.faculty, sub: `${c.code} · ${c.facultyEmail}`, to: `${R}/courses?q=${encodeURIComponent(c.code)}` }));
    seedAssignments.filter((a) => hit(a.title)).forEach((a) => out.push({ group: "Assignments", label: a.title, sub: a.courseCode, to: `${R}/assignments?q=${encodeURIComponent(a.title)}` }));
    seedEvents.filter((e) => hit(e.title)).forEach((e) => out.push({ group: "Events", label: e.title, sub: e.venue, to: `${R}/events?q=${encodeURIComponent(e.title)}` }));
    seedClubs.filter((c) => hit(c.name)).forEach((c) => out.push({ group: "Clubs", label: c.name, sub: c.category, to: `${R}/clubs?q=${encodeURIComponent(c.name)}` }));
    posts.filter((p) => hit(p.body) || hit(p.author)).slice(0, 5).forEach((p) => out.push({ group: "Posts", label: p.body.slice(0, 60), sub: p.author, to: `${R}?q=${encodeURIComponent(p.body.slice(0, 20))}` }));
    conversations.filter((c) => hit(c.name) || c.messages.some((m) => hit(m.body))).forEach((c) => out.push({ group: "Messages", label: c.name, sub: c.kind === "group" ? "Group chat" : "Direct message", to: `${R}/messages?c=${c.id}` }));
    seedBooks.filter((b) => hit(b.title) || hit(b.author)).forEach((b) => out.push({ group: "Library", label: b.title, sub: b.author, to: `${R}/library?q=${encodeURIComponent(b.title)}` }));
    seedJobs.filter((j) => hit(j.company) || hit(j.role)).forEach((j) => out.push({ group: "Placements", label: `${j.role} · ${j.company}`, sub: j.type, to: `${R}/placements?q=${encodeURIComponent(j.company)}` }));
    seedPapers.filter((p) => hit(p.title) || hit(p.authors)).forEach((p) => out.push({ group: "Research", label: p.title, sub: p.authors, to: `${R}/research?q=${encodeURIComponent(p.title)}` }));
    seedCourses.filter(() => hit("alex johnson") || hit("aisha")).slice(0, 0).forEach(() => {});
    if (hit("aisha verma")) out.push({ group: "Students", label: "Aisha Verma", sub: "CSE '27", to: `${R}/messages` });
    return out.slice(0, 24);
  }, [q, posts, conversations]);

  if (!open) return null;
  const groups = [...new Set(results.map((r) => r.group))];

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-foreground/30 p-4 pt-[12vh] backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl animate-rise-in overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_40px_100px_-40px_rgba(17,17,17,0.5)]">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, assignments, faculty, events, clubs, books, jobs..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {!q.trim() && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Start typing to search across your campus.</p>}
          {q.trim() && results.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results for “{q}”.</p>}
          {groups.map((g) => (
            <div key={g} className="mb-2">
              <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
              {results.filter((r) => r.group === g).map((r, i) => (
                <button
                  key={`${g}-${i}`}
                  onClick={() => { onClose(); navigate({ to: r.to }); }}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left transition hover:bg-[var(--accent)]/8"
                >
                  <span className="truncate text-sm text-foreground">{r.label}</span>
                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">{r.sub}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [q, setQ] = useState("");
  const items = useCampus((s) => s.notifications);
  const { markRead, markAllRead, deleteNotification, clearNotifications } = useCampus.getState();
  const unread = items.filter((n) => !n.read).length;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const shown = items.filter((n) => (filter === "unread" ? !n.read : true)).filter((n) => (n.title + n.body).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" className="relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] animate-rise-in overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_30px_80px_-40px_rgba(17,17,17,0.5)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <div className="flex gap-2">
              <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button>
              <button onClick={() => { clearNotifications(); toast.success("Notifications cleared"); }} className="text-xs text-destructive hover:opacity-80">Clear</button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none" />
            <button onClick={() => setFilter(filter === "all" ? "unread" : "all")} className={cn("rounded-full px-3 py-1.5 text-xs", filter === "unread" ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
              {filter === "unread" ? "Unread" : "All"}
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {shown.length === 0 && <p className="px-4 py-10 text-center text-xs text-muted-foreground">Nothing here.</p>}
            {shown.map((n) => (
              <div key={n.id} className={cn("group flex gap-3 border-b border-border/60 px-4 py-3 transition hover:bg-[var(--accent)]/6", !n.read && "bg-[var(--accent)]/5")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-muted-foreground/30" : "bg-[var(--accent)]")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(n.at)}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => markRead(n.id, !n.read)} aria-label="Toggle read" className="rounded-md p-1 text-muted-foreground hover:text-foreground"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteNotification(n.id)} aria-label="Delete" className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const profile = useCampus((s) => s.profile);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Profile menu" className="h-9 w-9 overflow-hidden rounded-full border border-border transition hover:ring-4 hover:ring-[var(--accent)]/15">
        <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 animate-rise-in overflow-hidden rounded-[18px] border border-border bg-card p-2 shadow-[0_30px_80px_-40px_rgba(17,17,17,0.5)]">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <button onClick={() => { setOpen(false); navigate({ to: `${R}/profile` }); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"><User className="h-4 w-4" /> View profile</button>
          <button onClick={() => { setOpen(false); navigate({ to: `${R}/settings` }); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"><SettingsIcon className="h-4 w-4" /> Settings</button>
          <button onClick={() => { setOpen(false); navigate({ to: `${R}/messages` }); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"><Mail className="h-4 w-4" /> Messages</button>
          <button onClick={() => { toast.success("Signed out"); navigate({ to: "/login" }); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      )}
    </div>
  );
}

function SidebarLinks({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unreadMessages = useCampus((s) => s.conversations.reduce((a, c) => a + c.unread, 0));
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to} to={item.to as never} onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-200",
              active ? "bg-[var(--accent)]/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />}
            <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110", active && "text-[var(--accent)]")} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.label === "Messages" && unreadMessages > 0 && (
              <span className="ml-auto rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">{unreadMessages}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout() {
  useTheme();
  const offline = useOffline();
  const hydrated = useHydrated();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const theme = useCampus((s) => s.settings.theme);
  const toggleTheme = useCampus((s) => s.toggleTheme);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? "Campus";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") { e.preventDefault(); toggleTheme(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") { e.preventDefault(); navigate({ to: `${R}/ai` }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTheme, navigate]);

  useEffect(() => { setDrawer(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {offline && (
        <div className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-xs text-background">
          <WifiOff className="h-3.5 w-3.5" /> You're offline — changes are saved locally and will sync later.
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-card px-3 py-5 lg:flex">
          <Link to="/" className="mb-6 flex items-center gap-2 px-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background">A</span>
            <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
          </Link>
          <div className="flex-1 overflow-y-auto pr-1">
            <SidebarLinks />
          </div>
          <button onClick={() => { toast.success("Signed out"); navigate({ to: "/login" }); }} className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-[18px] w-[18px]" /> Logout
          </button>
        </aside>

        {/* Drawer (mobile) */}
        {drawer && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[270px] animate-rise-in flex-col border-r border-border bg-card px-3 py-5">
              <div className="mb-6 flex items-center justify-between px-3">
                <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
                <button onClick={() => setDrawer(false)} aria-label="Close menu"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto"><SidebarLinks onNavigate={() => setDrawer(false)} /></div>
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-full p-2 text-muted-foreground hover:bg-muted lg:hidden">
                <Menu className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="group flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-left text-sm text-muted-foreground transition-all duration-300 hover:border-foreground/20 focus:ring-4 focus:ring-[var(--accent)]/10 md:max-w-sm"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 truncate">Search anything...</span>
                <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] md:block">⌘K</kbd>
              </button>
              <p className="hidden flex-1 text-center text-sm font-semibold tracking-tight text-foreground xl:block">{title}</p>
              <div className="ml-auto flex items-center gap-1">
                <Btn variant="accent" size="sm" className="hidden sm:inline-flex" onClick={() => navigate({ to: "/dashboard/student", search: { compose: "1" } })}>
                  <Plus className="h-3.5 w-3.5" /> Create
                </Btn>
                <Link to={`${R}/messages`} aria-label="Messages" className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <MessageSquare className="h-[18px] w-[18px]" />
                </Link>
                <NotificationBell />
                <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </button>
                <ProfileMenu />
              </div>
            </div>
          </header>

          <main className="px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
            {hydrated ? <Outlet /> : <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}
          </main>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-around border-t border-border bg-card/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to as never} className={cn("flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] transition", active ? "text-[var(--accent)]" : "text-muted-foreground")}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

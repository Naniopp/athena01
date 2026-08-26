import { useState } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home, Compass, Users, CalendarHeart, BookOpen, MessageSquare, Bookmark, User, Settings,
  Presentation, CheckSquare, ClipboardList, FileText, FolderOpen, Gauge, UserCog, Grid3X3,
  CheckCheck, BarChart3, Megaphone, Building2, Hash, ShieldCheck, Activity, Server, KeyRound,
  ScrollText, LogOut, Menu, X, Sparkles, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/rbac/useSession";
import { ROLE_LABEL, type NavItem } from "@/lib/rbac/matrix";
import { signOutEverywhere } from "@/lib/auth-session";

const ICONS: Record<string, typeof Home> = {
  home: Home, compass: Compass, users: Users, "calendar-heart": CalendarHeart, book: BookOpen,
  message: MessageSquare, bookmark: Bookmark, user: User, settings: Settings,
  presentation: Presentation, check: CheckSquare, clipboard: ClipboardList, file: FileText,
  folder: FolderOpen, gauge: Gauge, "user-cog": UserCog, grid: Grid3X3, "check-check": CheckCheck,
  chart: BarChart3, megaphone: Megaphone, building: Building2, hash: Hash, shield: ShieldCheck,
  activity: Activity, server: Server, key: KeyRound, scroll: ScrollText,
};

/**
 * Shared workspace shell for faculty / HOD / admin / super-admin.
 * Navigation comes from the RBAC matrix filtered by the user's real permissions.
 */
export function RoleShell() {
  const { session, nav, isLoading, error } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutEverywhere();
    navigate({ to: "/login", replace: true });
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">We couldn't load your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session may have expired. Sign in again to continue.
          </p>
          <button
            onClick={handleSignOut}
            className="mt-6 rounded-2xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const initials = session.profile.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const link = (item: NavItem) => {
    const Icon = ICONS[item.icon] ?? Home;
    const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to + "/"));
    return (
      <a
        key={item.to}
        href={item.to}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
          active
            ? "bg-[#F97316]/10 text-[#F97316]"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        {item.label}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
              <Sparkles className="h-4 w-4 text-[#F97316]" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">ATHENA</span>
          </a>
          <span className="ml-2 hidden rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
            {ROLE_LABEL[session.role]}
            {session.profile.departmentName ? ` · ${session.profile.departmentName}` : ""}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight text-foreground">{session.profile.fullName}</div>
              <div className="text-xs text-muted-foreground">{session.profile.email}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#111] text-xs font-semibold text-white">
              {initials || "A"}
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-border p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-8">
        <aside
          className={cn(
            "fixed inset-x-0 top-[57px] z-30 border-b border-border bg-background p-4 lg:static lg:block lg:w-64 lg:shrink-0 lg:border-0 lg:p-0",
            open ? "block" : "hidden",
          )}
        >
          <nav className="flex flex-col gap-1 lg:sticky lg:top-20">{nav.map(link)}</nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

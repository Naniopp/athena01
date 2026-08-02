import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Calendar, Crown, Megaphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCampus } from "@/lib/campus/store";
import { seedClubs, type Club } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Skeleton, Empty, Badge, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/clubs")({
  component: ClubsPage,
  validateSearch: (search: Record<string, unknown>): { q?: string } => (typeof search.q === "string" && search.q ? { q: search.q } : {}),
  head: () => ({
    meta: [
      { title: "Clubs · ATHENA" },
      { name: "description", content: "Discover, join, and manage campus clubs and their activities." },
      { property: "og:title", content: "Clubs · ATHENA" },
      { property: "og:description", content: "Browse campus clubs, join, and track upcoming activities." },
    ],
  }),
});

const CATEGORIES = ["All", ...Array.from(new Set(seedClubs.map((c) => c.category)))];

function ClubsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const loading = useLoading();
  const joinedClubs = useCampus((s) => s.joinedClubs);
  const toggleClub = useCampus((s) => s.toggleClub);

  const [q, setQ] = useState(search.q ?? "");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [active, setActive] = useState<Club | null>(null);

  const setQuery = (v: string) => {
    setQ(v);
    navigate({ to: "/dashboard/student/clubs", search: { q: v }, replace: true });
  };

  const clubs = useMemo(() => {
    return seedClubs.filter((c) => {
      const matchesQ = !q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || c.tagline.toLowerCase().includes(q.toLowerCase());
      const matchesCat = category === "All" || c.category === category;
      const matchesTab = tab === "all" || joinedClubs.includes(c.id);
      return matchesQ && matchesCat && matchesTab;
    });
  }, [q, category, tab, joinedClubs]);

  const onToggle = (c: Club) => {
    const willJoin = !joinedClubs.includes(c.id);
    toggleClub(c.id);
    toast.success(willJoin ? `Joined ${c.name}` : `Left ${c.name}`);
  };

  return (
    <div>
      <PageHeader title="Clubs" subtitle="Find your people and keep up with campus club life." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <SearchInput value={q} onChange={setQuery} placeholder="Search clubs..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
        <div className="ml-auto flex gap-2 rounded-full border border-border bg-card p-1">
          <Chip active={tab === "all"} onClick={() => setTab("all")}>All clubs</Chip>
          <Chip active={tab === "mine"} onClick={() => setTab("mine")}>My clubs ({joinedClubs.length})</Chip>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : clubs.length === 0 ? (
        <Empty title="No clubs found" hint="Try a different search or category." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => {
            const joined = joinedClubs.includes(c.id);
            return (
              <Card key={c.id} hover className="flex flex-col">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white" style={{ backgroundColor: c.cover }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.tagline}</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{c.category}</Badge>
                  <Badge><Users className="mr-1 inline h-3 w-3" />{c.members}</Badge>
                  {joined && <Badge tone="success">Joined</Badge>}
                </div>
                <div className="mt-auto flex gap-2">
                  <Btn size="sm" variant="outline" className="flex-1" onClick={() => setActive(c)}>View</Btn>
                  <Btn size="sm" variant={joined ? "danger" : "accent"} className="flex-1" onClick={() => onToggle(c)}>
                    {joined ? "Leave" : "Join"}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name ?? ""} wide>
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{active.category}</Badge>
              <Badge><Users className="mr-1 inline h-3 w-3" />{active.members} members</Badge>
              {joinedClubs.includes(active.id) && <Badge tone="success">Joined</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{active.about}</p>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Crown className="h-3.5 w-3.5" /> Leadership
              </p>
              <p className="text-sm text-foreground">President · {active.name} Core Team</p>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Upcoming activities
              </p>
              {active.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activities scheduled right now.</p>
              ) : (
                <div className="space-y-2">
                  {active.events.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5">
                      <span className="text-sm text-foreground">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{e.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Megaphone className="h-3.5 w-3.5" /> Member feed
              </p>
              {joinedClubs.includes(active.id) ? (
                active.announcements.length ? (
                  <div className="space-y-2">
                    {active.announcements.map((a) => (
                      <div key={a.id} className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
                        {a.body}
                        <p className="mt-1 text-[11px] text-muted-foreground">{a.date}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No announcements yet — check back soon.</p>
                )
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" /> Join this club to unlock member-only announcements.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Btn variant={joinedClubs.includes(active.id) ? "danger" : "accent"} onClick={() => onToggle(active)}>
                {joinedClubs.includes(active.id) ? "Leave club" : "Join club"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

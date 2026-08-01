import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarPlus, MapPin, Clock, Users, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useCampus } from "@/lib/campus/store";
import { seedEvents, type CampusEvent } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Skeleton, Empty, Badge, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/events")({
  component: EventsPage,
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === "string" ? search.q : "" }),
  head: () => ({
    meta: [
      { title: "Events · ATHENA" },
      { name: "description", content: "Browse and register for upcoming campus events." },
      { property: "og:title", content: "Events · ATHENA" },
      { property: "og:description", content: "Discover hackathons, workshops, and fests happening on campus." },
    ],
  }),
});

const CATEGORIES = ["All", ...Array.from(new Set(seedEvents.map((e) => e.category)))];

function isPast(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now() - 86400000;
}

function EventsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const loading = useLoading();
  const registeredEvents = useCampus((s) => s.registeredEvents);
  const bookmarkedEvents = useCampus((s) => s.bookmarkedEvents);
  const toggleEvent = useCampus((s) => s.toggleEvent);
  const toggleEventBookmark = useCampus((s) => s.toggleEventBookmark);
  const addReminder = useCampus((s) => s.addReminder);

  const [q, setQ] = useState(search.q ?? "");
  const [category, setCategory] = useState("All");
  const [when, setWhen] = useState<"all" | "upcoming" | "past">("upcoming");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [active, setActive] = useState<CampusEvent | null>(null);

  const setQuery = (v: string) => {
    setQ(v);
    navigate({ to: "/dashboard/student/events", search: { q: v }, replace: true });
  };

  const events = useMemo(() => {
    return seedEvents
      .filter((e) => {
        const matchesQ = !q.trim() || e.title.toLowerCase().includes(q.toLowerCase()) || e.venue.toLowerCase().includes(q.toLowerCase());
        const matchesCat = category === "All" || e.category === category;
        const past = isPast(e.date);
        const matchesWhen = when === "all" || (when === "upcoming" ? !past : past);
        const matchesTab = tab === "all" || registeredEvents.includes(e.id);
        return matchesQ && matchesCat && matchesWhen && matchesTab;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [q, category, when, tab, registeredEvents]);

  const onToggle = (e: CampusEvent) => {
    const willReg = !registeredEvents.includes(e.id);
    toggleEvent(e.id);
    toast.success(willReg ? `Registered for ${e.title}` : `Unregistered from ${e.title}`);
  };

  const onBookmark = (e: CampusEvent) => {
    const willSave = !bookmarkedEvents.includes(e.id);
    toggleEventBookmark(e.id);
    toast.success(willSave ? "Bookmarked" : "Bookmark removed");
  };

  const onAddCalendar = (e: CampusEvent) => {
    addReminder({ title: e.title, date: e.date, time: e.time, note: e.venue });
    toast.success(`Added "${e.title}" to your calendar`);
  };

  return (
    <div>
      <PageHeader title="Events" subtitle="Register for hackathons, workshops, and campus fests." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <SearchInput value={q} onChange={setQuery} placeholder="Search events..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
        <div className="flex gap-2">
          {(["upcoming", "past", "all"] as const).map((w) => (
            <Chip key={w} active={when === w} onClick={() => setWhen(w)}>{w[0].toUpperCase() + w.slice(1)}</Chip>
          ))}
        </div>
        <div className="ml-auto flex gap-2 rounded-full border border-border bg-card p-1">
          <Chip active={tab === "all"} onClick={() => setTab("all")}>All events</Chip>
          <Chip active={tab === "mine"} onClick={() => setTab("mine")}>My registrations ({registeredEvents.length})</Chip>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : events.length === 0 ? (
        <Empty title="No events found" hint="Adjust your filters or search." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const registered = registeredEvents.includes(e.id);
            const saved = bookmarkedEvents.includes(e.id);
            const seatsLeft = e.seats - e.registered;
            return (
              <Card key={e.id} hover className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white" style={{ backgroundColor: e.cover }}>
                    {e.title.slice(0, 2).toUpperCase()}
                  </span>
                  <button onClick={() => onBookmark(e)} aria-label="Bookmark" className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    {saved ? <BookmarkCheck className="h-4 w-4 text-[var(--accent)]" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mb-1 text-sm font-semibold text-foreground">{e.title}</p>
                <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {e.venue}</p>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{e.category}</Badge>
                  <Badge><Clock className="mr-1 inline h-3 w-3" />{e.date} · {e.time}</Badge>
                  <Badge tone={seatsLeft < 10 ? "danger" : "muted"}>{seatsLeft} seats left</Badge>
                  {registered && <Badge tone="success">Registered</Badge>}
                </div>
                <div className="mt-auto flex gap-2">
                  <Btn size="sm" variant="outline" className="flex-1" onClick={() => setActive(e)}>Details</Btn>
                  <Btn size="sm" variant={registered ? "danger" : "accent"} className="flex-1" onClick={() => onToggle(e)}>
                    {registered ? "Unregister" : "Register"}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title ?? ""} wide>
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{active.category}</Badge>
              <Badge><Clock className="mr-1 inline h-3 w-3" />{active.date} · {active.time}</Badge>
              <Badge><MapPin className="mr-1 inline h-3 w-3" />{active.venue}</Badge>
              <Badge><Users className="mr-1 inline h-3 w-3" />{active.seats - active.registered} seats left</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{active.about}</p>
            <p className="text-sm text-foreground">Organiser · Student Activity Council</p>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Btn variant="outline" onClick={() => onAddCalendar(active)}>
                <CalendarPlus className="h-4 w-4" /> Add to calendar
              </Btn>
              <Btn variant={registeredEvents.includes(active.id) ? "danger" : "accent"} onClick={() => onToggle(active)}>
                {registeredEvents.includes(active.id) ? "Unregister" : "Register"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

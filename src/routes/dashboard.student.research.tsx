import { useMemo, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { BookOpen, Search, Bookmark, BookmarkCheck, Copy, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCampus } from "@/lib/campus/store";
import { seedPapers, type Paper } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Skeleton, Empty, Badge, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/research")({
  component: ResearchPage,
  head: () => ({
    meta: [
      { title: "Research — ATHENA" },
      { name: "description", content: "Explore papers, projects, and collaborators across campus research." },
      { property: "og:title", content: "Research — ATHENA" },
      { property: "og:description", content: "Explore papers, projects, and collaborators across campus research." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s.q === "string" && s.q ? { q: s.q } : {}),
});

const OPEN_PROJECTS = [
  { id: "op1", title: "Campus Energy Optimization", lead: "Dr. Meera Krishnan", area: "Systems", seats: 2 },
  { id: "op2", title: "Multilingual Chat Assistant", lead: "AI Society", area: "NLP", seats: 3 },
  { id: "op3", title: "Low-cost Air Quality Sensors", lead: "Robotics Club", area: "IoT", seats: 4 },
];

function ResearchPage() {
  const search = useSearch({ from: "/dashboard/student/research" });
  const loading = useLoading();
  const bookmarkedPapers = useCampus((s) => s.bookmarkedPapers);
  const togglePaper = useCampus((s) => s.togglePaper);

  const [q, setQ] = useState(search.q ?? "");
  const [field, setField] = useState("All");
  const [year, setYear] = useState("All");
  const [sort, setSort] = useState<"citations" | "date">("date");
  const [tab, setTab] = useState<"all" | "bookmarked">("all");
  const [active, setActive] = useState<Paper | null>(null);

  const fields = useMemo(() => ["All", ...Array.from(new Set(seedPapers.map((p) => p.area)))], []);
  const years = useMemo(() => ["All", ...Array.from(new Set(seedPapers.map((p) => String(p.year)))).sort().reverse()], []);

  // derive a plausible citation count deterministically
  const citationsOf = (p: Paper) => (p.id.charCodeAt(2) * 17 + p.title.length * 3) % 240;

  const filtered = useMemo(() => {
    let list = seedPapers.filter((p) =>
      (p.title.toLowerCase().includes(q.toLowerCase()) || p.authors.toLowerCase().includes(q.toLowerCase())) &&
      (field === "All" || p.area === field) &&
      (year === "All" || String(p.year) === year),
    );
    if (tab === "bookmarked") list = list.filter((p) => bookmarkedPapers.includes(p.id));
    list = [...list].sort((a, b) =>
      sort === "citations" ? citationsOf(b) - citationsOf(a) : b.year - a.year,
    );
    return list;
  }, [q, field, year, sort, tab, bookmarkedPapers]);

  const copyCitation = (p: Paper) => {
    const citation = `${p.authors}. "${p.title}." ${p.venue}, ${p.year}.`;
    navigator.clipboard?.writeText(citation);
    toast.success("Citation copied");
  };

  return (
    <div>
      <PageHeader
        title="Research"
        subtitle="Papers, projects, and open collaborations across campus."
        action={
          <div className="flex gap-2">
            <Chip active={tab === "all"} onClick={() => setTab("all")}>All</Chip>
            <Chip active={tab === "bookmarked"} onClick={() => setTab("bookmarked")}>Bookmarked</Chip>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <SearchInput value={q} onChange={setQ} placeholder="Search papers, projects, authors..." />
        </div>
        <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground outline-none">
          {fields.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground outline-none">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <Chip active={sort === "date"} onClick={() => setSort("date")}>Newest</Chip>
          <Chip active={sort === "citations"} onClick={() => setSort("citations")}>Most cited</Chip>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty title="No results" hint="Try a different search or filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => {
            const bookmarked = bookmarkedPapers.includes(p.id);
            return (
              <Card key={p.id} hover className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={p.kind === "project" ? "ink" : "accent"}>{p.kind === "project" ? "Project" : "Paper"}</Badge>
                  <button onClick={() => { togglePaper(p.id); toast.success(bookmarked ? "Removed bookmark" : "Bookmarked"); }} aria-label="Bookmark">
                    {bookmarked ? <BookmarkCheck className="h-4 w-4 text-[var(--accent)]" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
                <button onClick={() => setActive(p)} className="mt-2 text-left text-sm font-semibold text-foreground hover:text-[var(--accent)]">
                  {p.title}
                </button>
                <p className="mt-1 text-xs text-muted-foreground">{p.authors} · {p.venue}, {p.year}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.abstract}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-[11px] text-muted-foreground">{citationsOf(p)} citations</span>
                  <div className="flex gap-2">
                    <Btn size="sm" variant="outline" onClick={() => copyCitation(p)}><Copy className="h-3.5 w-3.5" /> Cite</Btn>
                    <Btn size="sm" variant="outline" onClick={() => setActive(p)}><BookOpen className="h-3.5 w-3.5" /> Read</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-[var(--accent)]" /> Find collaborators / open projects</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {OPEN_PROJECTS.map((op) => (
            <Card key={op.id}>
              <p className="text-sm font-semibold text-foreground">{op.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Led by {op.lead}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {op.seats} seats open · {op.area}</div>
              <Btn size="sm" variant="accent" className="mt-4 w-full" onClick={() => toast.success(`Request sent to join ${op.title}`)}>
                Request to join
              </Btn>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title ?? ""} wide>
        {active && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{active.authors} · {active.venue}, {active.year} · {active.area}</p>
            <p className="text-sm text-foreground">{active.abstract}</p>
            <div className="flex gap-2 pt-2">
              <Btn variant="accent" onClick={() => copyCitation(active)}><Copy className="h-4 w-4" /> Copy citation</Btn>
              <Btn variant="outline" onClick={() => { togglePaper(active.id); toast.success(bookmarkedPapers.includes(active.id) ? "Removed bookmark" : "Bookmarked"); }}>
                {bookmarkedPapers.includes(active.id) ? "Remove bookmark" : "Bookmark"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

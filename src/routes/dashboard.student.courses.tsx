import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen, Bookmark, Search, SlidersHorizontal, Mail, MapPin, Download, Megaphone, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCampus } from "@/lib/campus/store";
import { seedCourses, type Course } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Progress, Badge, Skeleton, Empty, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/courses")({
  component: CoursesPage,
  head: () => ({
    meta: [
      { title: "My Courses · ATHENA" },
      { name: "description", content: "Browse your enrolled courses, faculty details, resources, and announcements." },
      { property: "og:title", content: "My Courses · ATHENA" },
      { property: "og:description", content: "Everything about your semester, in one place." },
    ],
  }),
});

type SortKey = "progress" | "attendance";

function getQueryParam(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

function AttendanceRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} strokeWidth="6" className="stroke-muted" fill="none" />
        <circle
          cx="32" cy="32" r={r} strokeWidth="6" fill="none" strokeLinecap="round"
          stroke="var(--accent)" strokeDasharray={c} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">{value}%</div>
    </div>
  );
}

function CoursesPage() {
  const loading = useLoading(500);
  const bookmarked = useCampus((s) => s.bookmarkedCourses);
  const { toggleCourseBookmark } = useCampus.getState();
  const [query, setQuery] = useState(getQueryParam("q"));
  const [semester, setSemester] = useState<number | "all">("all");
  const [creditFilter, setCreditFilter] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortKey | "">("");
  const [active, setActive] = useState<Course | null>(null);

  const semesters = useMemo(() => [...new Set(seedCourses.map((c) => c.semester))].sort(), []);
  const credits = useMemo(() => [...new Set(seedCourses.map((c) => c.credits))].sort(), []);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    let list = seedCourses.filter(
      (c) => !t || c.title.toLowerCase().includes(t) || c.code.toLowerCase().includes(t) || c.faculty.toLowerCase().includes(t),
    );
    if (semester !== "all") list = list.filter((c) => c.semester === semester);
    if (creditFilter !== "all") list = list.filter((c) => c.credits === creditFilter);
    if (sort) list = [...list].sort((a, b) => b[sort] - a[sort]);
    return list;
  }, [query, semester, creditFilter, sort]);

  return (
    <div>
      <PageHeader
        title="My Courses"
        subtitle={`${seedCourses.length} courses enrolled this semester`}
        action={<Badge tone="accent">{bookmarked.length} bookmarked</Badge>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="max-w-xs flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder="Search courses, code, faculty..." />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={semester === "all"} onClick={() => setSemester("all")}>All semesters</Chip>
          {semesters.map((s) => (
            <Chip key={s} active={semester === s} onClick={() => setSemester(s)}>Sem {s}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={creditFilter === "all"} onClick={() => setCreditFilter("all")}>All credits</Chip>
          {credits.map((c) => (
            <Chip key={c} active={creditFilter === c} onClick={() => setCreditFilter(c)}>{c} cr</Chip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey | "")}
            className="rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground outline-none"
          >
            <option value="">Sort by...</option>
            <option value="progress">Progress</option>
            <option value="attendance">Attendance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty title="No courses match your filters" hint="Try clearing search or filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const isBookmarked = bookmarked.includes(c.id);
            return (
              <Card key={c.id} hover className="cursor-pointer" onClick={() => setActive(c)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${c.color}1f`, color: c.color }}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.code}</p>
                      <p className="text-xs text-muted-foreground">{c.credits} credits · Sem {c.semester}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCourseBookmark(c.id); toast.success(isBookmarked ? "Removed bookmark" : "Course bookmarked"); }}
                    className={cn("rounded-full p-1.5 transition", isBookmarked ? "text-[var(--accent)]" : "text-muted-foreground hover:text-foreground")}
                    aria-label="Bookmark course"
                  >
                    <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-[var(--accent)]")} />
                  </button>
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">{c.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.faculty} · {c.room}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span>{c.progress}%</span>
                  </div>
                  <Progress value={c.progress} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Attendance</span><span>{c.attendance}%</span>
                  </div>
                  <Progress value={c.attendance} tone="ink" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active ? `${active.code} · ${active.title}` : ""} wide>
        {active && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <AttendanceRing value={active.attendance} />
              <div className="flex-1 space-y-1">
                <p className="flex items-center gap-2 text-sm text-foreground"><Mail className="h-4 w-4 text-muted-foreground" /> {active.faculty} · {active.facultyEmail}</p>
                <p className="flex items-center gap-2 text-sm text-foreground"><MapPin className="h-4 w-4 text-muted-foreground" /> {active.room}</p>
              </div>
              <Btn variant="accent" onClick={() => toast.success(`Message sent to ${active.faculty}`)}>Message faculty</Btn>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Course progress</p>
              <Progress value={active.progress} />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Resources</p>
              <div className="space-y-2">
                {active.resources.length === 0 && <p className="text-xs text-muted-foreground">No resources uploaded yet.</p>}
                {active.resources.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5">
                    <div>
                      <p className="text-sm text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.type} · {r.size}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`Downloading ${r.name}`)}
                      className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Download resource"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Announcements</p>
              <div className="space-y-2">
                {active.announcements.length === 0 && <p className="text-xs text-muted-foreground">No announcements yet.</p>}
                {active.announcements.map((a) => (
                  <div key={a.id} className="flex gap-3 rounded-2xl bg-muted px-4 py-2.5">
                    <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.body}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">{a.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

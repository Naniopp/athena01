import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, IndianRupee, CalendarClock, Bookmark, BookmarkCheck, Check, Clock, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCampus } from "@/lib/campus/store";
import { seedJobs, type Job } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Skeleton, Empty, Badge, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/placements")({
  component: PlacementsPage,
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === "string" ? search.q : "" }),
  head: () => ({
    meta: [
      { title: "Placements · ATHENA" },
      { name: "description", content: "Browse job and internship openings and track your applications." },
      { property: "og:title", content: "Placements · ATHENA" },
      { property: "og:description", content: "Apply, save, and track placement opportunities on campus." },
    ],
  }),
});

const TYPES = ["All", "Internship", "Full-time"] as const;
const LOCATIONS = ["All", ...Array.from(new Set(seedJobs.map((j) => j.location)))];

function stipendValue(ctc: string) {
  const n = parseFloat(ctc.replace(/[^0-9.]/g, "")) || 0;
  if (ctc.toLowerCase().includes("lpa")) return n * 100000;
  if (ctc.toLowerCase().includes("month")) return n * 1000 * 12;
  return n;
}

function daysLeft(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function PlacementsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const loading = useLoading();
  const savedJobs = useCampus((s) => s.savedJobs);
  const appliedJobs = useCampus((s) => s.appliedJobs);
  const toggleJob = useCampus((s) => s.toggleJob);
  const applyJob = useCampus((s) => s.applyJob);
  const withdrawJob = useCampus((s) => s.withdrawJob);

  const [q, setQ] = useState(search.q ?? "");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [location, setLocation] = useState("All");
  const [tab, setTab] = useState<"all" | "saved" | "applied">("all");
  const [active, setActive] = useState<Job | null>(null);

  const setQuery = (v: string) => {
    setQ(v);
    navigate({ to: "/dashboard/student/placements", search: { q: v }, replace: true });
  };

  const jobs = useMemo(() => {
    return seedJobs
      .filter((j) => {
        const t = q.trim().toLowerCase();
        const matchesQ = !t || j.company.toLowerCase().includes(t) || j.role.toLowerCase().includes(t) || j.skills.some((s) => s.toLowerCase().includes(t));
        const matchesType = type === "All" || j.type === type;
        const matchesLoc = location === "All" || j.location === location;
        const matchesTab = tab === "all" || (tab === "saved" ? savedJobs.includes(j.id) : appliedJobs.some((a) => a.id === j.id));
        return matchesQ && matchesType && matchesLoc && matchesTab;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [q, type, location, tab, savedJobs, appliedJobs]);

  const chartData = useMemo(() => {
    const applied = appliedJobs.length;
    const saved = savedJobs.filter((id) => !appliedJobs.some((a) => a.id === id)).length;
    const closingSoon = seedJobs.filter((j) => daysLeft(j.deadline) <= 5 && !appliedJobs.some((a) => a.id === j.id)).length;
    return [
      { status: "Applied", count: applied },
      { status: "Saved", count: saved },
      { status: "Closing soon", count: closingSoon },
    ];
  }, [appliedJobs, savedJobs]);

  const onSave = (j: Job) => {
    const willSave = !savedJobs.includes(j.id);
    toggleJob(j.id);
    toast.success(willSave ? "Saved to your list" : "Removed from saved");
  };
  const onApply = (j: Job) => {
    applyJob(j.id);
    toast.success(`Applied to ${j.role} at ${j.company}`);
  };
  const onWithdraw = (j: Job) => {
    withdrawJob(j.id);
    toast.success(`Withdrew application for ${j.role}`);
  };

  return (
    <div>
      <PageHeader title="Placements" subtitle="Track openings and manage your applications." />

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <SearchInput value={q} onChange={setQuery} placeholder="Search role, company, skill..." />
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
              ))}
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground outline-none"
            >
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="ml-auto flex gap-2 rounded-full border border-border bg-card p-1">
              <Chip active={tab === "all"} onClick={() => setTab("all")}>All</Chip>
              <Chip active={tab === "saved"} onClick={() => setTab("saved")}>Saved ({savedJobs.length})</Chip>
              <Chip active={tab === "applied"} onClick={() => setTab("applied")}>Applied ({appliedJobs.length})</Chip>
            </div>
          </div>
        </Card>
        <Card>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application status</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Empty title="No jobs found" hint="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => {
            const saved = savedJobs.includes(j.id);
            const applied = appliedJobs.some((a) => a.id === j.id);
            const left = daysLeft(j.deadline);
            return (
              <Card key={j.id} hover className="flex flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{j.role}</p>
                    <p className="text-xs text-muted-foreground">{j.company}</p>
                  </div>
                  <button onClick={() => onSave(j)} aria-label="Save" className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    {saved ? <BookmarkCheck className="h-4 w-4 text-[var(--accent)]" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{j.type}</Badge>
                  <Badge><MapPin className="mr-1 inline h-3 w-3" />{j.location}</Badge>
                  <Badge><IndianRupee className="mr-1 inline h-3 w-3" />{j.ctc}</Badge>
                  <Badge tone={left <= 3 ? "danger" : "muted"}><CalendarClock className="mr-1 inline h-3 w-3" />{left > 0 ? `${left}d left` : "Closed"}</Badge>
                  {applied && <Badge tone="success">Applied</Badge>}
                </div>
                <div className="mt-auto flex gap-2">
                  <Btn size="sm" variant="outline" className="flex-1" onClick={() => setActive(j)}>Details</Btn>
                  {applied ? (
                    <Btn size="sm" variant="danger" className="flex-1" onClick={() => onWithdraw(j)}>Withdraw</Btn>
                  ) : (
                    <Btn size="sm" variant="accent" className="flex-1" onClick={() => onApply(j)}>Apply</Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active ? `${active.role} · ${active.company}` : ""} wide>
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{active.type}</Badge>
              <Badge><MapPin className="mr-1 inline h-3 w-3" />{active.location}</Badge>
              <Badge><IndianRupee className="mr-1 inline h-3 w-3" />{active.ctc}</Badge>
              <Badge><CalendarClock className="mr-1 inline h-3 w-3" />Deadline {active.deadline}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{active.about}</p>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eligibility / skills</p>
              <div className="flex flex-wrap gap-2">
                {active.skills.map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
            </div>

            {appliedJobs.some((a) => a.id === active.id) && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application status</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-emerald-600"><Check className="h-3.5 w-3.5" /> Applied</div>
                  <span className="h-px w-6 bg-border" />
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Under review</div>
                  <span className="h-px w-6 bg-border" />
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    {active.interview ? <><Send className="h-3.5 w-3.5" /> Interview: {active.interview}</> : <><XCircle className="h-3.5 w-3.5" /> Not scheduled</>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Btn variant="outline" onClick={() => onSave(active)}>{savedJobs.includes(active.id) ? "Unsave" : "Save"}</Btn>
              {appliedJobs.some((a) => a.id === active.id) ? (
                <Btn variant="danger" onClick={() => onWithdraw(active)}>Withdraw</Btn>
              ) : (
                <Btn variant="accent" onClick={() => onApply(active)}>Apply now</Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

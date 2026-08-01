import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText, Search, Upload, Trash2, Clock, CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { useCampus } from "@/lib/campus/store";
import { seedAssignments, type Assignment } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Badge, Empty, Skeleton, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/assignments")({
  component: AssignmentsPage,
  head: () => ({
    meta: [
      { title: "Assignments · ATHENA" },
      { name: "description", content: "Track, submit, and review all your course assignments in one place." },
      { property: "og:title", content: "Assignments · ATHENA" },
      { property: "og:description", content: "Stay ahead of every deadline." },
    ],
  }),
});

type Tab = "All" | "Pending" | "Submitted" | "Graded" | "Overdue";
const TABS: Tab[] = ["All", "Pending", "Submitted", "Graded", "Overdue"];
type SortKey = "due" | "points";

function statusOf(a: Assignment, hasSubmission: boolean): Tab {
  if (a.status === "graded") return "Graded";
  if (hasSubmission || a.status === "submitted") return "Submitted";
  if (a.due < Date.now()) return "Overdue";
  return "Pending";
}

function countdown(due: number) {
  const diff = due - Date.now();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  if (diff < 0) return `Overdue by ${days > 0 ? `${days}d` : `${hours}h`}`;
  return days > 0 ? `Due in ${days}d ${hours}h` : `Due in ${hours}h`;
}

function badgeFor(status: Tab) {
  switch (status) {
    case "Graded": return <Badge tone="success">Graded</Badge>;
    case "Submitted": return <Badge tone="accent">Submitted</Badge>;
    case "Overdue": return <Badge tone="danger">Overdue</Badge>;
    default: return <Badge tone="muted">Pending</Badge>;
  }
}

function AssignmentsPage() {
  const loading = useLoading(500);
  const submissions = useCampus((s) => s.submissions);
  const { submitAssignment, deleteSubmission } = useCampus.getState();
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("due");
  const [active, setActive] = useState<Assignment | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const rows = useMemo(() => {
    const t = query.trim().toLowerCase();
    let list = seedAssignments
      .map((a) => ({ a, status: statusOf(a, !!submissions[a.id]) }))
      .filter(({ a }) => !t || a.title.toLowerCase().includes(t) || a.courseCode.toLowerCase().includes(t));
    if (tab !== "All") list = list.filter(({ status }) => status === tab);
    list = [...list].sort((x, y) => (sort === "due" ? x.a.due - y.a.due : y.a.points - x.a.points));
    return list;
  }, [query, tab, sort, submissions]);

  const stats = useMemo(() => {
    const total = seedAssignments.length;
    const done = seedAssignments.filter((a) => a.status === "graded" || a.status === "submitted" || submissions[a.id]).length;
    const graded = seedAssignments.filter((a) => a.status === "graded" && a.grade != null);
    const avg = graded.length ? Math.round(graded.reduce((s, a) => s + (a.grade! / a.points) * 100, 0) / graded.length) : 0;
    const chartData = seedAssignments.map((a) => ({ name: a.courseCode, score: a.grade != null ? Math.round((a.grade / a.points) * 100) : 0 }));
    return { completion: Math.round((done / total) * 100), avg, chartData };
  }, [submissions]);

  function openSubmit(a: Assignment) {
    setActive(a);
    setFile(null);
  }

  function handleSubmit() {
    if (!active || !file) return;
    submitAssignment(active.id, { fileName: file.name, size: file.size, at: Date.now() });
    toast.success(`Submitted "${active.title}"`);
    setActive(null);
    setFile(null);
  }

  return (
    <div>
      <PageHeader title="Assignments" subtitle={`${seedAssignments.length} assignments across your courses`} />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted-foreground">Completion</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.completion}%</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Average grade</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.avg}%</p>
        </Card>
        <Card className="sm:col-span-1">
          <p className="mb-1 text-xs text-muted-foreground">Grades by course</p>
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="score" radius={[4, 4, 4, 4]} fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}
        </div>
        <div className="max-w-xs flex-1"><SearchInput value={query} onChange={setQuery} placeholder="Search assignments..." /></div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground outline-none">
          <option value="due">Sort by due date</option>
          <option value="points">Sort by points</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : rows.length === 0 ? (
        <Empty title="No assignments here" hint="Try a different tab or search term." />
      ) : (
        <div className="space-y-3">
          {rows.map(({ a, status }) => {
            const sub = submissions[a.id];
            return (
              <Card key={a.id} className="flex flex-wrap items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    {badgeFor(status)}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.courseCode} · {a.points} points</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {countdown(a.due)}
                </div>
                {a.status === "graded" && a.grade != null && (
                  <Badge tone="success">{a.grade}/{a.points}</Badge>
                )}
                {sub && (
                  <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" /> {sub.fileName}
                    <button onClick={() => { deleteSubmission(a.id); toast.success("Submission removed"); }} className="text-muted-foreground hover:text-destructive" aria-label="Remove submission">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {a.status !== "graded" && !sub && (
                  <Btn variant="accent" size="sm" onClick={() => openSubmit(a)}>Submit</Btn>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active ? `Submit · ${active.title}` : ""}>
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{active.brief}</p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center transition hover:border-[var(--accent)]/50">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-foreground">{file ? file.name : "Click to choose a file"}</span>
              {file && <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>}
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {!file && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" /> Select a file before submitting.</p>
            )}
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setActive(null)}>Cancel</Btn>
              <Btn variant="accent" disabled={!file} onClick={handleSubmit}>Submit assignment</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

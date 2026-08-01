import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useCampus } from "@/lib/campus/store";
import { seedCalendar, type CalendarItem } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, Field, Badge, Empty, Skeleton, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Calendar · ATHENA" },
      { name: "description", content: "See classes, exams, events and reminders in one calendar with month, week and agenda views." },
      { property: "og:title", content: "Calendar · ATHENA" },
      { property: "og:description", content: "Plan your semester with a unified campus calendar." },
    ],
  }),
});

type ViewMode = "month" | "week" | "agenda";
type ItemType = CalendarItem["type"];

const TYPE_COLORS: Record<ItemType, string> = {
  class: "bg-[var(--accent)]/15 text-[var(--accent)]",
  exam: "bg-destructive/15 text-destructive",
  event: "bg-emerald-500/15 text-emerald-600",
  reminder: "bg-foreground/10 text-foreground",
};

const TYPE_LABEL: Record<ItemType, string> = { class: "Class", exam: "Exam", event: "Event", reminder: "Reminder" };

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function CalendarPage() {
  const loading = useLoading(450);
  const reminders = useCampus((s) => s.reminders);
  const addReminder = useCampus((s) => s.addReminder);
  const editReminder = useCampus((s) => s.editReminder);
  const deleteReminder = useCampus((s) => s.deleteReminder);

  const allItems: CalendarItem[] = useMemo(
    () => [...seedCalendar.filter((c) => c.type !== "reminder"), ...reminders],
    [reminders],
  );

  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [typeFilters, setTypeFilters] = useState<ItemType[]>(["class", "exam", "event", "reminder"]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState({ title: "", date: "", time: "", note: "" });
  const [errors, setErrors] = useState<{ title?: string; date?: string; time?: string }>({});

  const filtered = allItems.filter((i) => typeFilters.includes(i.type));

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    filtered.forEach((i) => {
      map[i.date] = map[i.date] ? [...map[i.date], i] : [i];
    });
    return map;
  }, [filtered]);

  const toggleType = (t: ItemType) =>
    setTypeFilters((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const openAdd = (date?: string) => {
    setEditing(null);
    setForm({ title: "", date: date ?? ymd(new Date()), time: "09:00", note: "" });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: CalendarItem) => {
    setEditing(item);
    setForm({ title: item.title, date: item.date, time: item.time, note: item.note ?? "" });
    setErrors({});
    setModalOpen(true);
  };

  const save = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.date) e.date = "Date is required";
    if (!form.time) e.time = "Time is required";
    setErrors(e);
    if (Object.keys(e).length) return;
    if (editing) {
      editReminder(editing.id, { title: form.title.trim(), date: form.date, time: form.time, note: form.note.trim() || undefined });
      toast.success("Reminder updated");
    } else {
      addReminder({ title: form.title.trim(), date: form.date, time: form.time, note: form.note.trim() || undefined });
      toast.success("Reminder added");
    }
    setModalOpen(false);
  };

  const remove = (id: string) => {
    deleteReminder(id);
    toast("Reminder deleted");
  };

  // month grid
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // week grid
  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const upcoming = filtered
    .filter((i) => new Date(`${i.date}T${i.time}`).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 8);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const nav = (dir: -1 | 1) => {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Calendar" subtitle="Loading your schedule..." />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Classes, exams, events and your personal reminders in one place."
        action={<Btn variant="accent" onClick={() => openAdd()}><Plus className="h-4 w-4" /> Add reminder</Btn>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => nav(-1)} aria-label="Previous" className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <p className="min-w-[160px] text-center text-sm font-semibold text-foreground">{view === "week" ? `Week of ${weekStart.toLocaleDateString()}` : monthLabel}</p>
          <button onClick={() => nav(1)} aria-label="Next" className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          <Btn size="sm" variant="outline" onClick={() => setCursor(new Date())}>Today</Btn>
        </div>
        <div className="flex items-center gap-2">
          {(["month", "week", "agenda"] as ViewMode[]).map((v) => (
            <Chip key={v} active={view === v} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</Chip>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABEL) as ItemType[]).map((t) => (
          <Chip key={t} active={typeFilters.includes(t)} onClick={() => toggleType(t)}>{TYPE_LABEL[t]}</Chip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-x-auto">
          {view === "agenda" && (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <Empty title="No items" hint="Adjust filters or add a reminder." />
              ) : (
                [...filtered]
                  .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
                  .map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{i.title}</p>
                        <p className="text-xs text-muted-foreground">{i.date} · {i.time}</p>
                      </div>
                      <Badge tone="muted"><span className={`rounded-full px-1 ${TYPE_COLORS[i.type]}`}>{TYPE_LABEL[i.type]}</span></Badge>
                    </div>
                  ))
              )}
            </div>
          )}

          {view === "month" && (
            <div>
              <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, idx) => {
                  const key = ymd(d);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = key === ymd(new Date());
                  const dayItems = itemsByDate[key] ?? [];
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(key)}
                      className={`min-h-[84px] rounded-xl border p-1.5 text-left align-top transition ${selectedDate === key ? "border-[var(--accent)]" : "border-border"} ${inMonth ? "" : "opacity-40"} hover:bg-muted`}
                    >
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${isToday ? "bg-[var(--accent)] text-white" : "text-foreground"}`}>{d.getDate()}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 2).map((i) => (
                          <div key={i.id} className={`truncate rounded px-1 py-0.5 text-[10px] ${TYPE_COLORS[i.type]}`}>{i.title}</div>
                        ))}
                        {dayItems.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayItems.length - 2} more</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === "week" && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d) => {
                const key = ymd(d);
                const dayItems = itemsByDate[key] ?? [];
                const isToday = key === ymd(new Date());
                return (
                  <button key={key} onClick={() => setSelectedDate(key)} className={`min-h-[220px] rounded-xl border p-2 text-left ${selectedDate === key ? "border-[var(--accent)]" : "border-border"} hover:bg-muted`}>
                    <p className={`mb-2 text-xs font-medium ${isToday ? "text-[var(--accent)]" : "text-muted-foreground"}`}>{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</p>
                    <div className="space-y-1">
                      {dayItems.map((i) => (
                        <div key={i.id} className={`rounded px-1.5 py-1 text-[11px] ${TYPE_COLORS[i.type]}`}>
                          <p className="truncate font-medium">{i.title}</p>
                          <p className="opacity-70">{i.time}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{selectedDate ?? "Select a day"}</p>
              {selectedDate && <Btn size="sm" variant="ghost" onClick={() => openAdd(selectedDate)}><Plus className="h-3.5 w-3.5" /></Btn>}
            </div>
            {!selectedDate && <p className="text-xs text-muted-foreground">Click a day on the calendar to see items.</p>}
            {selectedDate && (itemsByDate[selectedDate]?.length ?? 0) === 0 && <Empty title="Nothing scheduled" hint="Add a reminder for this day." />}
            <div className="space-y-2">
              {(itemsByDate[selectedDate ?? ""] ?? []).map((i) => (
                <div key={i.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.time}{i.note ? ` · ${i.note}` : ""}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[i.type]}`}>{TYPE_LABEL[i.type]}</span>
                  </div>
                  {i.type === "reminder" && (
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => openEdit(i)} className="rounded-full p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => remove(i.id)} className="rounded-full p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-semibold text-foreground">Upcoming</p>
            </div>
            {upcoming.length === 0 ? (
              <Empty title="No upcoming items" />
            ) : (
              <div className="space-y-2">
                {upcoming.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.date} · {i.time}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[i.type]}`}>{TYPE_LABEL[i.type]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit reminder" : "Add reminder"}>
        <div className="space-y-4">
          <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Submit lab report" error={errors.title} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} error={errors.date} />
            <Field label="Time" type="time" value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} error={errors.time} />
          </div>
          <Field label="Note (optional)" value={form.note} onChange={(v) => setForm((f) => ({ ...f, note: v }))} textarea placeholder="Any details..." />
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="outline" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn variant="accent" onClick={save}>{editing ? "Save changes" : "Add reminder"}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

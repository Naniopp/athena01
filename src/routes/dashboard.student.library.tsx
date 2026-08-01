import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Star, BookOpen, Hash, History } from "lucide-react";
import { toast } from "sonner";
import { useCampus } from "@/lib/campus/store";
import { seedBooks, type Book } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, SearchInput, Skeleton, Empty, Badge, useLoading } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/library")({
  component: LibraryPage,
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === "string" ? search.q : "" }),
  head: () => ({
    meta: [
      { title: "Library · ATHENA" },
      { name: "description", content: "Search the campus library catalogue and manage your reservations." },
      { property: "og:title", content: "Library · ATHENA" },
      { property: "og:description", content: "Reserve, renew, and track books from the campus library." },
    ],
  }),
});

const CATEGORIES = ["All", ...Array.from(new Set(seedBooks.map((b) => b.category)))];

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function LibraryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const loading = useLoading();
  const reservedBooks = useCampus((s) => s.reservedBooks);
  const borrowHistory = useCampus((s) => s.borrowHistory);
  const reserveBook = useCampus((s) => s.reserveBook);
  const cancelBook = useCampus((s) => s.cancelBook);
  const renewBook = useCampus((s) => s.renewBook);

  const [q, setQ] = useState(search.q ?? "");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [active, setActive] = useState<Book | null>(null);

  const setQuery = (v: string) => {
    setQ(v);
    navigate({ to: "/dashboard/student/library", search: { q: v }, replace: true });
  };

  const books = useMemo(() => {
    const t = q.trim().toLowerCase();
    return seedBooks.filter((b) => {
      const matchesQ = !t || b.title.toLowerCase().includes(t) || b.author.toLowerCase().includes(t) || b.isbn.includes(t);
      const matchesCat = category === "All" || b.category === category;
      const matchesAvail = availability === "all" || (availability === "available" ? b.copies > 0 : b.copies === 0);
      return matchesQ && matchesCat && matchesAvail;
    });
  }, [q, category, availability]);

  const reservationFor = (id: string) => reservedBooks.find((r) => r.id === id);

  const onReserve = (b: Book) => {
    reserveBook(b.id);
    toast.success(`Reserved "${b.title}"`);
  };
  const onCancel = (b: Book) => {
    cancelBook(b.id);
    toast.success(`Cancelled reservation for "${b.title}"`);
  };
  const onRenew = (b: Book) => {
    renewBook(b.id);
    toast.success(`Renewed "${b.title}" for 14 more days`);
  };

  return (
    <div>
      <PageHeader title="Library" subtitle="Search the catalogue and manage your book reservations." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <SearchInput value={q} onChange={setQuery} placeholder="Search title, author, or ISBN..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "available", "unavailable"] as const).map((a) => (
            <Chip key={a} active={availability === a} onClick={() => setAvailability(a)}>{a[0].toUpperCase() + a.slice(1)}</Chip>
          ))}
        </div>
      </div>

      {reservedBooks.length > 0 && (
        <Card className="mb-6">
          <p className="mb-3 text-sm font-semibold text-foreground">My reservations</p>
          <div className="space-y-2">
            {reservedBooks.map((r) => {
              const book = seedBooks.find((b) => b.id === r.id);
              if (!book) return null;
              const overdue = r.due < Date.now();
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{book.title}</p>
                    <p className="text-xs text-muted-foreground">Due {fmtDate(r.due)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge tone="danger">Overdue</Badge>}
                    <Btn size="sm" variant="outline" onClick={() => onRenew(book)}>Renew</Btn>
                    <Btn size="sm" variant="danger" onClick={() => onCancel(book)}>Cancel</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : books.length === 0 ? (
        <Empty title="No books found" hint="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => {
            const reservation = reservationFor(b.id);
            return (
              <Card key={b.id} hover className="flex flex-col">
                <p className="mb-1 text-sm font-semibold text-foreground">{b.title}</p>
                <p className="mb-3 text-xs text-muted-foreground">{b.author} · {b.year}</p>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{b.category}</Badge>
                  <Badge><Star className="mr-1 inline h-3 w-3" />{b.rating}</Badge>
                  <Badge tone={b.copies > 0 ? "success" : "danger"}>{b.copies > 0 ? `${b.copies} available` : "Out of stock"}</Badge>
                </div>
                <div className="mt-auto flex gap-2">
                  <Btn size="sm" variant="outline" className="flex-1" onClick={() => setActive(b)}>Details</Btn>
                  {reservation ? (
                    <Btn size="sm" variant="danger" className="flex-1" onClick={() => onCancel(b)}>Cancel</Btn>
                  ) : (
                    <Btn size="sm" variant="accent" className="flex-1" disabled={b.copies === 0} onClick={() => onReserve(b)}>Reserve</Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {borrowHistory.length > 0 && (
        <Card className="mt-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><History className="h-4 w-4" /> Borrow history</p>
          <div className="space-y-2">
            {borrowHistory.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm">
                <span className="text-foreground">{h.title}</span>
                <span className="text-xs text-muted-foreground">{h.borrowed} → {h.returned}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title ?? ""}>
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{active.author} · {active.year}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{active.category}</Badge>
              <Badge><Star className="mr-1 inline h-3 w-3" />{active.rating}</Badge>
              <Badge><Hash className="mr-1 inline h-3 w-3" />{active.isbn}</Badge>
              <Badge tone={active.copies > 0 ? "success" : "danger"}>{active.copies > 0 ? `${active.copies} copies available` : "Out of stock"}</Badge>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" /> Reservations hold for 14 days and can be renewed once.
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              {reservationFor(active.id) ? (
                <>
                  <Btn variant="outline" onClick={() => onRenew(active)}>Renew</Btn>
                  <Btn variant="danger" onClick={() => onCancel(active)}>Cancel reservation</Btn>
                </>
              ) : (
                <Btn variant="accent" disabled={active.copies === 0} onClick={() => onReserve(active)}>Reserve</Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

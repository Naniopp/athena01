import type { ReactNode } from "react";
import { Card } from "@/components/campus/ui";

export function StatGrid({ items }: { items: { label: string; value: ReactNode; hint?: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{s.value}</div>
          {s.hint && <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>}
        </Card>
      ))}
    </div>
  );
}

export function ActivityList({
  rows,
}: {
  rows: { id: string; action: string; entity: string; actor: string | null; at: string }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{r.action}</div>
            <div className="text-xs text-muted-foreground">
              {r.entity}
              {r.actor ? ` · ${r.actor}` : ""}
            </div>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground">
            {new Date(r.at).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  );
}

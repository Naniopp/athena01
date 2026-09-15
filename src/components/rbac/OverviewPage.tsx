import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, PageHeader } from "@/components/campus/ui";
import { StatGrid, ActivityList } from "@/components/rbac/StatGrid";
import { getOverviewStats, type OverviewStats } from "@/lib/rbac/overview.functions";
import { useSession } from "@/lib/rbac/useSession";
import { ROLE_NAV, type Role } from "@/lib/rbac/matrix";

type StatKey = keyof Omit<OverviewStats, "recentAudit">;

const LABEL: Record<StatKey, string> = {
  students: "Students",
  faculty: "Faculty",
  departments: "Departments",
  posts: "Posts",
  communities: "Communities",
  events: "Events",
  pendingApprovals: "Pending approvals",
  reportsOpen: "Open reports",
};

/** Shared overview screen for the staff dashboards; each role picks its own metrics. */
export function OverviewPage({
  role,
  title,
  subtitle,
  metrics,
}: {
  role: Role;
  title: string;
  subtitle: string;
  metrics: StatKey[];
}) {
  const { session, permissions } = useSessionSafe();
  const fetchStats = useServerFn(getOverviewStats);
  const { data, isLoading } = useQuery({
    queryKey: ["athena", "overview", role],
    queryFn: () => fetchStats(),
    staleTime: 30_000,
  });

  const shortcuts = ROLE_NAV[role]
    .filter((i) => i.to !== ROLE_NAV[role][0]!.to)
    .filter((i) => !i.permission || permissions.includes(i.permission))
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={
          session?.profile.departmentName ? `${subtitle} · ${session.profile.departmentName}` : subtitle
        }
      />

      {isLoading || !data ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
        </div>
      ) : (
        <StatGrid items={metrics.map((k) => ({ label: LABEL[k], value: data[k] }))} />
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          <div className="mt-3">
            <ActivityList rows={data?.recentAudit ?? []} />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Jump back in
          </h2>
          <div className="mt-3 grid gap-2">
            {shortcuts.map((s) => (
              <a
                key={s.to}
                href={s.to}
                className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:border-[#F97316]/40 hover:bg-[#F97316]/5"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function useSessionSafe() {
  const s = useSession();
  return { session: s.session, permissions: s.session?.permissions ?? [] };
}

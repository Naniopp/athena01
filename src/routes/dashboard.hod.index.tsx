import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/rbac/OverviewPage";

export const Route = createFileRoute("/dashboard/hod/")({
  component: () => (
    <OverviewPage
      role="hod"
      title="Department overview"
      subtitle="Staffing, academics and approvals"
      metrics={["students", "faculty", "pendingApprovals", "events"]}
    />
  ),
});

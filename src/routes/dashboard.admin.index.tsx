import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/rbac/OverviewPage";

export const Route = createFileRoute("/dashboard/admin/")({
  component: () => (
    <OverviewPage
      role="admin"
      title="Campus administration"
      subtitle="People, communities and moderation"
      metrics={["students", "faculty", "departments", "reportsOpen"]}
    />
  ),
});

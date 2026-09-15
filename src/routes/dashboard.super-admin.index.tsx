import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/rbac/OverviewPage";

export const Route = createFileRoute("/dashboard/super-admin/")({
  component: () => (
    <OverviewPage
      role="super_admin"
      title="System control"
      subtitle="Institution, roles and security"
      metrics={["departments", "students", "faculty", "posts"]}
    />
  ),
});

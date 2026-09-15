import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/rbac/OverviewPage";

export const Route = createFileRoute("/dashboard/faculty/")({
  component: () => (
    <OverviewPage
      role="faculty"
      title="Faculty workspace"
      subtitle="Your teaching day at a glance"
      metrics={["students", "posts", "events", "communities"]}
    />
  ),
});

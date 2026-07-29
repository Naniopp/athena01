import { createFileRoute, redirect } from "@tanstack/react-router";

const OTHER = ["faculty", "club", "admin"] as const;

export const Route = createFileRoute("/dashboard/$role")({
  beforeLoad: ({ params }) => {
    if (params.role === "student") {
      throw redirect({ to: "/dashboard/student-feed" });
    }
    const role = OTHER.includes(params.role as (typeof OTHER)[number]) ? params.role : undefined;
    throw redirect({ to: "/dashboards", search: role ? { role } : {} });
  },
});

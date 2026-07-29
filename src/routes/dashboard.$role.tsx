import { createFileRoute, redirect } from "@tanstack/react-router";

const VALID = ["student", "faculty", "club", "admin"] as const;

export const Route = createFileRoute("/dashboard/$role")({
  beforeLoad: ({ params }) => {
    const role = VALID.includes(params.role as (typeof VALID)[number]) ? params.role : undefined;
    throw redirect({ to: "/dashboards", search: role ? { role } : {} });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

const VALID = ["faculty", "club", "admin"] as const;

export const Route = createFileRoute("/dashboard/$role")({
  beforeLoad: ({ params }) => {
    const role = VALID.find((r) => r === params.role);
    throw redirect({ to: "/dashboards", search: role ? { role } : {} });
  },
});

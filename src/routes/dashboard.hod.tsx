import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/rbac/RoleShell";

export const Route = createFileRoute("/dashboard/hod")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { next: location.href } });
  },
  component: RoleShell,
  head: () => ({
    meta: [
      { title: "Department Console · ATHENA" },
      { name: "description", content: "Lead your department: faculty, subjects, timetable, approvals and reports." },
      { property: "og:title", content: "Department Console · ATHENA" },
      { property: "og:description", content: "Head of Department workspace for staffing, academics and approvals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

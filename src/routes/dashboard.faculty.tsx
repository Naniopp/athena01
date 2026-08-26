import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/rbac/RoleShell";

export const Route = createFileRoute("/dashboard/faculty")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { next: location.href } });
  },
  component: RoleShell,
  head: () => ({
    meta: [
      { title: "Faculty Workspace · ATHENA" },
      { name: "description", content: "Teach, mentor and track your classes from the ATHENA faculty workspace." },
      { property: "og:title", content: "Faculty Workspace · ATHENA" },
      { property: "og:description", content: "Classes, attendance, assignments and student engagement in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

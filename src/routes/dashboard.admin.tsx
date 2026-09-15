import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/rbac/RoleShell";

export const Route = createFileRoute("/dashboard/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { next: location.href } });
  },
  component: RoleShell,
  head: () => ({
    meta: [
      { title: "Administration · ATHENA" },
      { name: "description", content: "Manage users, departments, communities, moderation and campus announcements." },
      { property: "og:title", content: "Administration · ATHENA" },
      { property: "og:description", content: "Institution-wide administration for the ATHENA campus platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

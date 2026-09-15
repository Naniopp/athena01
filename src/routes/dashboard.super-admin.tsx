import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/rbac/RoleShell";

export const Route = createFileRoute("/dashboard/super-admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { next: location.href } });
  },
  component: RoleShell,
  head: () => ({
    meta: [
      { title: "System Control · ATHENA" },
      { name: "description", content: "Institution settings, roles and permissions, security and full audit history." },
      { property: "og:title", content: "System Control · ATHENA" },
      { property: "og:description", content: "Super admin control centre for the ATHENA platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

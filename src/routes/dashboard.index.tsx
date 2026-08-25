import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMySession } from "@/lib/rbac/session.functions";
import { ROLE_HOME } from "@/lib/rbac/matrix";

/**
 * Role router: sends the signed-in user to the dashboard that matches their
 * highest role. Roles come from the database, never from the client.
 */
export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { next: location.href } });
    }
    const session = await getMySession();
    throw redirect({ href: ROLE_HOME[session.role] });
  },
});

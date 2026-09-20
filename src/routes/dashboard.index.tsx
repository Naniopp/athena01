import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingState } from "@/lib/rbac/onboarding.functions";

/**
 * Role router. Reads the account's role, onboarding stage and approval state
 * from the database and sends the user to the right place: setup if the
 * profile isn't finished, the pending screen while an elevated request is
 * under review, otherwise the dashboard for their role.
 */
export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { next: location.href } });
    }
    const state = await getOnboardingState();
    throw redirect({ href: state.redirectTo });
  },
});

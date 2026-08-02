import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/campus/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/student")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { next: location.href } });
    }
  },
  component: DashboardLayout,

  head: () => ({
    meta: [
      { title: "Student Workspace · ATHENA" },
      { name: "description", content: "Courses, assignments, attendance, clubs, placements and your AI campus assistant in one workspace." },
      { property: "og:title", content: "Student Workspace · ATHENA" },
      { property: "og:description", content: "The ATHENA smart campus workspace for students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

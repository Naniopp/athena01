import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface OverviewStats {
  students: number;
  faculty: number;
  departments: number;
  posts: number;
  communities: number;
  events: number;
  pendingApprovals: number;
  reportsOpen: number;
  recentAudit: { id: string; action: string; entity: string; actor: string | null; at: string }[];
}

/** Aggregate counters for the staff dashboards. RLS scopes what each role can see. */
export const getOverviewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OverviewStats> => {
    const { supabase } = context;
    const head = { count: "exact" as const, head: true };

    const [students, faculty, departments, posts, communities, events, approvals, reports, audit] =
      await Promise.all([
        supabase.from("user_roles").select("id", head).eq("role", "student"),
        supabase.from("user_roles").select("id", head).eq("role", "faculty"),
        supabase.from("departments").select("id", head),
        supabase.from("posts").select("id", head),
        supabase.from("communities").select("id", head),
        supabase.from("events").select("id", head),
        supabase.from("approvals").select("id", head).eq("status", "pending"),
        supabase.from("reports").select("id", head).eq("status", "open"),
        supabase
          .from("audit_logs")
          .select("id, action, entity, actor_name, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    return {
      students: students.count ?? 0,
      faculty: faculty.count ?? 0,
      departments: departments.count ?? 0,
      posts: posts.count ?? 0,
      communities: communities.count ?? 0,
      events: events.count ?? 0,
      pendingApprovals: approvals.count ?? 0,
      reportsOpen: reports.count ?? 0,
      recentAudit: (audit.data ?? []).map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        actor: r.actor_name,
        at: r.created_at,
      })),
    };
  });

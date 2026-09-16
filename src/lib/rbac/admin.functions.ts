import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./authorize.server";
import { isRole, type Role } from "./matrix";

/**
 * Administrative operations. Every handler re-checks the caller's real
 * permissions server-side — the UI never decides what a user may do.
 */

export interface RoleRequestRow {
  id: string;
  requestedRole: Role | null;
  status: string;
  subject: string;
  details: string | null;
  createdAt: string;
  userId: string | null;
  profileName: string | null;
  profileEmail: string | null;
}

export const listRoleRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RoleRequestRow[]> => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "approvals.decide");

    const { data, error } = await supabase
      .from("approvals")
      .select("id, requested_role, status, subject_line, details, created_at, target_user_id")
      .eq("kind", "role_request")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((r) => r.target_user_id).filter((v): v is string => !!v);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids)
      : { data: [] as { user_id: string; full_name: string; email: string | null }[] };
    const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return (data ?? []).map((r) => {
      const p = r.target_user_id ? byUser.get(r.target_user_id) : undefined;
      return {
        id: r.id,
        requestedRole: isRole(r.requested_role) ? (r.requested_role as Role) : null,
        status: r.status,
        subject: r.subject_line,
        details: r.details,
        createdAt: r.created_at,
        userId: r.target_user_id ?? null,
        profileName: p?.full_name ?? null,
        profileEmail: p?.email ?? null,
      };
    });
  });

export const decideRoleRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; decision: "approve" | "reject" }) => {
    if (!data?.id) throw new Error("Missing request id.");
    if (data.decision !== "approve" && data.decision !== "reject") throw new Error("Invalid decision.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "approvals.decide");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: request, error } = await supabaseAdmin
      .from("approvals")
      .select("id, requested_role, target_user_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!request) throw new Error("That request no longer exists.");
    if (request.status !== "pending") throw new Error("That request has already been decided.");

    const requested = request.requested_role as Role | null;
    if (!requested || !isRole(requested)) throw new Error("That request has no valid role.");

    // Only a super admin may grant super_admin or admin.
    if (requested === "super_admin" || requested === "admin") {
      await requirePermission(supabase, userId, "admins.manage");
    }

    const approve = data.decision === "approve";

    if (approve && request.target_user_id) {
      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", request.target_user_id)
        .eq("role", requested)
        .maybeSingle();
      if (!existing) {
        const { error: grantError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: request.target_user_id, role: requested });
        if (grantError) throw new Error(grantError.message);
      }
      await supabaseAdmin
        .from("profiles")
        .update({ approval_status: "approved", status: "active" })
        .eq("user_id", request.target_user_id);
    } else if (request.target_user_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("user_id", request.target_user_id);
    }

    await supabaseAdmin
      .from("approvals")
      .update({
        status: approve ? "approved" : "rejected",
        decided_by: null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: userId,
      action: approve ? "role_request.approved" : "role_request.rejected",
      entity: "approvals",
      entity_id: request.id,
      metadata: { role: requested, target: request.target_user_id },
    });

    return { ok: true };
  });

export interface ManagedUser {
  userId: string;
  name: string;
  email: string | null;
  status: string;
  isOwner: boolean;
  approvalStatus: string;
  requestedRole: Role | null;
  roles: Role[];
}

export const listManagedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "users.view");

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, status, is_owner, approval_status, requested_role")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const { data: roleRows } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, Role[]>();
    for (const row of roleRows ?? []) {
      const list = roleMap.get(row.user_id) ?? [];
      list.push(row.role as Role);
      roleMap.set(row.user_id, list);
    }

    return (profiles ?? [])
      .filter((p): p is typeof p & { user_id: string } => typeof p.user_id === "string")
      .map((p) => ({
        userId: p.user_id,
        name: p.full_name,
        email: p.email,
        status: String(p.status),
        isOwner: !!p.is_owner,
        approvalStatus: p.approval_status ?? "none",
        requestedRole: isRole(p.requested_role) ? (p.requested_role as Role) : null,
        roles: roleMap.get(p.user_id) ?? [],
      }));
  });

/** Grant or revoke a role. Super admin grants require admins.manage. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; role: Role; action: "grant" | "revoke" }) => {
    if (!data?.userId) throw new Error("Missing user.");
    if (!isRole(data.role)) throw new Error("Unknown role.");
    if (data.action !== "grant" && data.action !== "revoke") throw new Error("Invalid action.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "roles.manage");
    if (data.role === "super_admin" || data.role === "admin") {
      await requirePermission(supabase, userId, "admins.manage");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "grant") {
      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", data.userId)
        .eq("role", data.role)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: data.userId, role: data.role });
        if (error) throw new Error(error.message);
      }
    } else {
      const { data: owner } = await supabaseAdmin
        .from("profiles")
        .select("is_owner")
        .eq("user_id", data.userId)
        .maybeSingle();
      if (owner?.is_owner && data.role === "super_admin") {
        throw new Error("The institution owner cannot lose the super admin role.");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: userId,
      action: data.action === "grant" ? "role.granted" : "role.revoked",
      entity: "user_roles",
      entity_id: data.userId,
      metadata: { role: data.role },
    });

    return { ok: true };
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; status: "active" | "suspended" }) => {
    if (!data?.userId) throw new Error("Missing user.");
    if (data.status !== "active" && data.status !== "suspended") throw new Error("Invalid status.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "users.suspend");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("is_owner")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (target?.is_owner) throw new Error("The institution owner cannot be suspended.");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: userId,
      action: `user.${data.status}`,
      entity: "profiles",
      entity_id: data.userId,
      metadata: {},
    });

    return { ok: true };
  });

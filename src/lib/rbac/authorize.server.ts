import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permission, Role } from "./matrix";

/**
 * Server-side authorization helpers. Every protected server function must call
 * one of these before touching data — route guards are UX, this is the boundary.
 */

export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  permission: Permission,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission: permission,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Forbidden: missing permission ${permission}`);
}

export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  role: Role,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Forbidden: requires role ${role}`);
}

export async function myProfileId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc("my_profile_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No profile for the current user");
  return data as string;
}

export async function myDepartmentId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.rpc("my_department");
  return (data as string | null) ?? null;
}

/** Records an administrative or academic action in the audit trail. */
export async function writeAudit(
  supabase: SupabaseClient,
  entry: {
    actorUserId: string;
    actorName?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    departmentId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    actor_user_id: entry.actorUserId,
    actor_name: entry.actorName ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    department_id: entry.departmentId ?? null,
    metadata: (entry.metadata ?? {}) as never,
  });
  void supabase;
}

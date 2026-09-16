import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { primaryRole, type Permission, type Role } from "./matrix";

export interface SessionProfile {
  id: string;
  fullName: string;
  email: string | null;
  photoUrl: string | null;
  bio: string | null;
  departmentId: string | null;
  departmentName: string | null;
  programId: string | null;
  sectionId: string | null;
  year: number | null;
  rollNo: string | null;
  designation: string | null;
  privacy: "public" | "campus" | "private";
  status: string;
  isOwner: boolean;
  approvalStatus: "none" | "pending" | "approved" | "rejected" | "revoked";
  requestedRole: Role | null;
}

export interface SessionData {
  userId: string;
  profile: SessionProfile;
  roles: Role[];
  role: Role;
  permissions: Permission[];
}

/**
 * Returns the signed-in user's profile, roles and effective permissions.
 * Roles come from the database only. New accounts get student (or faculty when
 * requested); hod/admin raise an approval request; super_admin is reserved for
 * the bootstrap institution owner and existing super admins.
 */
export const getMySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionData> => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;
    const meta = (claims as { user_metadata?: Record<string, unknown> }).user_metadata ?? {};

    let { data: profile } = await supabase
      .from("profiles")
      .select("*, departments(name)")
      .eq("user_id", userId)
      .maybeSingle();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!profile) {
      const fullName =
        (typeof meta["full_name"] === "string" && meta["full_name"]) ||
        (typeof meta["name"] === "string" && meta["name"]) ||
        email?.split("@")[0] ||
        "New member";

      const { data: created, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: fullName,
          email,
          photo_url: typeof meta["avatar_url"] === "string" ? meta["avatar_url"] : null,
        })
        .select("*, departments(name)")
        .single();
      if (error) throw new Error(error.message);
      profile = created;
    }

    let { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    if (!roleRows || roleRows.length === 0) {
      // Self-service roles only. super_admin is never self-granted: it belongs
      // to the bootstrap owner or is assigned by an existing super admin.
      const requested = typeof meta["role"] === "string" ? (meta["role"] as string) : null;
      const selfServe = ["student", "faculty"];
      const privileged = ["hod", "admin"];
      const initial: Role = requested && selfServe.includes(requested) ? (requested as Role) : "student";

      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: initial });

      if (requested && privileged.includes(requested)) {
        await supabaseAdmin
          .from("profiles")
          .update({ requested_role: requested as Role, approval_status: "pending" })
          .eq("user_id", userId);
        await supabaseAdmin.from("approvals").insert({
          kind: "role_request",
          requested_role: requested as Role,
          target_user_id: userId,
          subject_line: `${profile.full_name} requested the ${requested} role`,
          details: `Requested at sign-up by ${email ?? "unknown email"}.`,
          requested_by: profile.id,
          department_id: profile.department_id,
          status: "pending",
        });
      } else if (requested === "super_admin") {
        // Rejected outright — recorded so the attempt is visible in the audit trail.
        await supabaseAdmin.from("audit_logs").insert({
          actor_user_id: userId,
          actor_name: profile.full_name,
          action: "role.super_admin_request_denied",
          entity: "user_roles",
          entity_id: userId,
          metadata: { requested },
        });
      }

      await supabaseAdmin.from("audit_logs").insert({
        actor_user_id: userId,
        actor_name: profile.full_name,
        action: "role.assigned_on_signup",
        entity: "user_roles",
        entity_id: userId,
        metadata: { role: initial, requested },
      });
      roleRows = [{ role: initial }];
    }

    const roles = roleRows.map((r) => r.role as Role);

    const { data: perms } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .in("role", roles);

    const permissions = Array.from(
      new Set((perms ?? []).map((p) => p.permission_key as Permission)),
    );

    const dept = (profile as { departments?: { name: string } | null }).departments ?? null;

    return {
      userId,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        photoUrl: profile.photo_url,
        bio: profile.bio,
        departmentId: profile.department_id,
        departmentName: dept?.name ?? null,
        programId: profile.program_id,
        sectionId: profile.section_id,
        year: profile.year,
        rollNo: profile.roll_no,
        designation: profile.designation,
        privacy: profile.privacy as SessionProfile["privacy"],
        status: profile.status,
      },
      roles,
      role: primaryRole(roles),
      permissions,
    };
  });

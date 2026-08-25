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
 * Creates the profile on first sign-in; the very first account on a fresh
 * install is bootstrapped as super_admin, everyone else defaults to student.
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
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true });
      const bootstrapRole: Role = (count ?? 0) === 0 ? "super_admin" : "student";
      const requested = typeof meta["role"] === "string" ? (meta["role"] as string) : null;
      const initial: Role =
        bootstrapRole === "super_admin"
          ? "super_admin"
          : requested === "faculty" || requested === "student"
            ? (requested as Role)
            : "student";

      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: initial });
      await supabaseAdmin.from("audit_logs").insert({
        actor_user_id: userId,
        actor_name: profile.full_name,
        action: "role.bootstrap",
        entity: "user_roles",
        entity_id: userId,
        metadata: { role: initial },
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

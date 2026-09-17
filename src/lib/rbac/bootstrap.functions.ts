import { createServerFn } from "@tanstack/react-start";

/**
 * First-run bootstrap. The institution owner is created once, directly as
 * super_admin — never as a student awaiting approval. Once an owner exists the
 * bootstrap endpoint refuses to run again, so no later visitor can claim it.
 */

export interface SetupState {
  needsSetup: boolean;
  institutionName: string | null;
}

/** Public probe: does this install still need its first owner? */
export const getSetupState = createServerFn({ method: "GET" }).handler(
  async (): Promise<SetupState> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: needs } = await supabaseAdmin.rpc("athena_needs_setup");
    const { data: inst } = await supabaseAdmin
      .from("institution")
      .select("name")
      .limit(1)
      .maybeSingle();
    return { needsSetup: needs === true, institutionName: inst?.name ?? null };
  },
);

export interface BootstrapInput {
  institutionName: string;
  institutionCode: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
}

export interface BootstrapResult {
  ok: boolean;
  role: "super_admin";
  redirectTo: string;
}

function validate(data: BootstrapInput): BootstrapInput {
  const clean = {
    institutionName: String(data.institutionName ?? "").trim(),
    institutionCode: String(data.institutionCode ?? "").trim().toUpperCase(),
    ownerName: String(data.ownerName ?? "").trim(),
    ownerEmail: String(data.ownerEmail ?? "").trim().toLowerCase(),
    password: String(data.password ?? ""),
  };
  if (clean.institutionName.length < 2) throw new Error("Enter your institution name.");
  if (clean.institutionCode.length < 2) throw new Error("Enter a short institution code.");
  if (clean.ownerName.length < 2) throw new Error("Enter the owner's full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.ownerEmail)) throw new Error("Enter a valid email address.");
  if (clean.password.length < 8) throw new Error("Use at least 8 characters for the password.");
  return clean;
}

/**
 * Creates the institution and its owner account. Guarded server-side by
 * athena_needs_setup(): if an owner already exists the call is rejected.
 */
export const createOwnerAccount = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<BootstrapResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: needs } = await supabaseAdmin.rpc("athena_needs_setup");
    if (needs !== true) {
      throw new Error("ATHENA has already been set up. Sign in with the owner account instead.");
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.ownerEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.ownerName, role: "super_admin", owner: true },
    });
    if (createError || !created.user) {
      const msg = createError?.message ?? "";
      if (/already been registered|already exists|duplicate/i.test(msg)) {
        throw new Error(
          "That email already has an ATHENA account. Use a different email for the owner account, or sign in with the existing one and set it up from there.",
        );
      }
      throw new Error(msg || "Could not create the owner account.");
    }
    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      full_name: data.ownerName,
      email: data.ownerEmail,
      is_owner: true,
      requested_role: "super_admin",
      approval_status: "approved",
      status: "active",
      designation: "Institution owner",
    });
    if (profileError) throw new Error(profileError.message);

    // Owner gets super_admin immediately — no request, no waiting period.
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "super_admin" });
    if (roleError) throw new Error(roleError.message);

    // Any previously seeded super admin steps down to administrator.
    const { data: others } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id")
      .eq("role", "super_admin")
      .neq("user_id", userId);
    for (const row of others ?? []) {
      await supabaseAdmin.from("user_roles").delete().eq("id", row.id);
      const { data: existingAdmin } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", row.user_id)
        .eq("role", "admin")
        .maybeSingle();
      if (!existingAdmin) {
        await supabaseAdmin.from("user_roles").insert({ user_id: row.user_id, role: "admin" });
      }
    }

    await supabaseAdmin.from("institution").insert({
      name: data.institutionName,
      code: data.institutionCode,
      owner_user_id: userId,
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: userId,
      actor_name: data.ownerName,
      action: "institution.bootstrap",
      entity: "institution",
      entity_id: null,
      metadata: { institution: data.institutionName, code: data.institutionCode },
    });

    return { ok: true, role: "super_admin", redirectTo: "/dashboard/super-admin" };
  });

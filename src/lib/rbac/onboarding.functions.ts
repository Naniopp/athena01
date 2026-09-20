import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Role } from "./matrix";

/**
 * Onboarding / setup state. Signup only creates the account; every profile
 * detail is collected here. The role always comes from the database, never
 * from the browser.
 */

export type OnboardingStatus = "not_started" | "in_progress" | "completed";

/** Plain JSON-safe answers collected during setup. */
export type SetupValues = Record<string, string | number | boolean | null | string[]>;

export interface OnboardingState {
  profileId: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
  onboardingStatus: OnboardingStatus;
  approvalStatus: "none" | "pending" | "approved" | "rejected" | "revoked";
  requestedRole: Role | null;
  isOwner: boolean;
  setupData: SetupValues;
  /** Where this account belongs right now. */
  redirectTo: string;
}

export const SETUP_SLUG: Record<Role, string> = {
  student: "student",
  faculty: "faculty",
  hod: "hod",
  admin: "administrator",
  super_admin: "super-admin",
};

export const SLUG_ROLE: Record<string, Role> = {
  student: "student",
  faculty: "faculty",
  hod: "hod",
  administrator: "administrator" as never,
  "super-admin": "super_admin",
};
SLUG_ROLE["administrator"] = "admin";

const ROLE_HOME: Record<Role, string> = {
  student: "/dashboard/student",
  faculty: "/dashboard/faculty",
  hod: "/dashboard/hod",
  admin: "/dashboard/admin",
  super_admin: "/dashboard/super-admin",
};

function destination(
  role: Role,
  onboarding: OnboardingStatus,
  approval: OnboardingState["approvalStatus"],
  requested: Role | null,
): string {
  if (onboarding !== "completed") return `/setup/${SETUP_SLUG[role]}`;
  if (approval === "pending" && requested && requested !== role) return "/pending-approval";
  return ROLE_HOME[role];
}

const PROFILE_COLUMNS =
  "id, full_name, email, phone, onboarding_status, setup_data, approval_status, requested_role, is_owner";

async function loadState(context: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
  claims?: unknown;
}): Promise<OnboardingState> {
  const { supabase, userId } = context;
  const claims = (context.claims ?? {}) as { email?: string; user_metadata?: Record<string, unknown> };
  const meta = claims.user_metadata ?? {};
  const email = claims.email ?? null;

  let { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // First visit after sign-up: create the account's profile row.
  if (!profile) {
    const fullName =
      (typeof meta["full_name"] === "string" && meta["full_name"]) ||
      (typeof meta["name"] === "string" && meta["name"]) ||
      email?.split("@")[0] ||
      "New member";
    const { data: created, error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone: typeof meta["phone"] === "string" ? meta["phone"] : null,
        photo_url: typeof meta["avatar_url"] === "string" ? meta["avatar_url"] : null,
        onboarding_status: "not_started",
      })
      .select(PROFILE_COLUMNS)
      .single();
    if (insertError) throw new Error(insertError.message);
    profile = created;
  }

  let { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  // No role yet: student/faculty are self-serve, hod/admin start as student
  // and record the request their setup will submit for approval.
  if (!roleRows || roleRows.length === 0) {
    const requested = typeof meta["role"] === "string" ? (meta["role"] as string) : null;
    const initial: Role = requested === "faculty" ? "faculty" : "student";
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: initial });
    if (requested === "hod" || requested === "admin") {
      const { data: updated } = await supabaseAdmin
        .from("profiles")
        .update({ requested_role: requested })
        .eq("id", profile.id)
        .select(PROFILE_COLUMNS)
        .single();
      if (updated) profile = updated;
    }
    roleRows = [{ role: initial }];
  }

  const roles = (roleRows ?? []).map((r) => r.role as Role);
  const rank: Role[] = ["super_admin", "admin", "hod", "faculty", "student"];
  const role = rank.find((r) => roles.includes(r)) ?? "student";

  const onboardingStatus = (profile.onboarding_status ?? "not_started") as OnboardingStatus;
  const approvalStatus = (profile.approval_status ?? "none") as OnboardingState["approvalStatus"];
  const requestedRole = (profile.requested_role as Role | null) ?? null;

  return {
    profileId: profile.id,
    role,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone ?? null,
    onboardingStatus,
    approvalStatus,
    requestedRole,
    isOwner: !!profile.is_owner,
    setupData: (profile.setup_data ?? {}) as SetupValues,
    redirectTo: destination(role, onboardingStatus, approvalStatus, requestedRole),
  };
}

export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadState(context));

export interface SaveStepInput {
  /** Partial answers merged into the saved draft. */
  values: SetupValues;
  step?: number;
}

/** Saves progress so setup can be resumed later. */
export const saveOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveStepInput) => ({
    values: (data?.values ?? {}) as SetupValues,
    step: typeof data?.step === "number" ? data.step : 0,
  }))
  .handler(async ({ data, context }): Promise<OnboardingState> => {
    const state = await loadState(context);
    const merged: SetupValues = { ...state.setupData, ...data.values, __step: data.step };
    const patch: Record<string, unknown> = {
      setup_data: merged,
      onboarding_status: state.onboardingStatus === "completed" ? "completed" : "in_progress",
    };
    if (typeof data.values["fullName"] === "string" && data.values["fullName"]) {
      patch["full_name"] = data.values["fullName"];
    }
    if (typeof data.values["phone"] === "string") patch["phone"] = data.values["phone"];
    if (typeof data.values["bio"] === "string") patch["bio"] = data.values["bio"];

    const { error } = await context.supabase.from("profiles").update(patch as never).eq("id", state.profileId);
    if (error) throw new Error(error.message);
    return loadState(context);
  });

function str(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}
function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}
function list(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Finishes setup: writes the role-specific record, marks onboarding complete
 * and — for HOD / Administrator — raises the approval request a super admin
 * has to review. The role itself is never changed here.
 */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { values: SetupValues }) => ({
    values: (data?.values ?? {}) as SetupValues,
  }))
  .handler(async ({ data, context }): Promise<OnboardingState> => {
    const state = await loadState(context);
    const v = { ...state.setupData, ...data.values } as SetupValues;
    const { supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!str(v["fullName"]) && !state.fullName) throw new Error("Please enter your full name.");

    const profilePatch: Record<string, unknown> = {
      setup_data: v,
      onboarding_status: "completed",
      full_name: str(v["fullName"]) ?? state.fullName,
      phone: str(v["phone"]),
      bio: str(v["bio"]),
      photo_url: str(v["photoUrl"]),
      privacy: (["public", "campus", "private"] as string[]).includes(String(v["privacy"]))
        ? (v["privacy"] as string)
        : "campus",
      skills: list(v["skills"]),
      interests: list(v["interests"]),
    };
    if (str(v["departmentId"])) profilePatch["department_id"] = str(v["departmentId"]);
    if (str(v["programId"])) profilePatch["program_id"] = str(v["programId"]);
    if (str(v["rollNo"])) profilePatch["roll_no"] = str(v["rollNo"]);
    if (str(v["designation"])) profilePatch["designation"] = str(v["designation"]);
    if (num(v["academicYear"])) profilePatch["year"] = num(v["academicYear"]);

    const { error: pErr } = await supabase.from("profiles").update(profilePatch as never).eq("id", state.profileId);
    if (pErr) throw new Error(pErr.message);

    const base = { profile_id: state.profileId };
    if (state.role === "student") {
      await supabase.from("student_profiles").upsert({
        ...base,
        roll_no: str(v["rollNo"]),
        institution: str(v["institution"]),
        department_id: str(v["departmentId"]),
        program_id: str(v["programId"]),
        academic_year: num(v["academicYear"]),
        semester: num(v["semester"]),
        section: str(v["section"]),
        admission_year: num(v["admissionYear"]),
        gender: str(v["gender"]),
        interests: list(v["interests"]),
        skills: list(v["skills"]),
        hobbies: list(v["hobbies"]),
      });
    } else if (state.role === "faculty") {
      await supabase.from("faculty_profiles").upsert({
        ...base,
        employee_id: str(v["employeeId"]),
        department_id: str(v["departmentId"]),
        designation: str(v["designation"]),
        qualification: str(v["qualification"]),
        specialisation: str(v["specialisation"]),
        experience_years: num(v["experienceYears"]),
        joining_year: num(v["joiningYear"]),
        subjects: list(v["subjects"]),
        programs: list(v["programs"]),
        office_room: str(v["officeRoom"]),
        office_hours: str(v["officeHours"]),
        expertise: list(v["expertise"]),
        research_interests: list(v["researchInterests"]),
      });
    }

    // Privileged requests: record the detail row and raise a review request.
    const requested = state.requestedRole;
    if (requested === "hod") {
      await supabaseAdmin.from("hod_profiles").upsert({
        ...base,
        employee_id: str(v["employeeId"]),
        department_id: str(v["departmentId"]),
        department_code: str(v["departmentCode"]),
        designation: str(v["designation"]),
        qualification: str(v["qualification"]),
        experience_years: num(v["experienceYears"]),
        joining_year: num(v["joiningYear"]),
        programs: list(v["programs"]),
        responsibilities: str(v["responsibilities"]),
      });
    }
    if (requested === "admin") {
      await supabaseAdmin.from("admin_profiles").upsert({
        ...base,
        employee_id: str(v["employeeId"]),
        designation: str(v["designation"]),
        admin_department: str(v["adminDepartment"]),
        institution: str(v["institution"]),
        experience_years: num(v["experienceYears"]),
        responsibilities: str(v["responsibilities"]),
        requested_areas: list(v["requestedAreas"]),
        reason: str(v["reason"]),
      });
    }

    if ((requested === "hod" || requested === "admin") && requested !== state.role) {
      const { data: open } = await supabaseAdmin
        .from("approvals")
        .select("id")
        .eq("kind", "role_request")
        .eq("target_user_id", context.userId)
        .eq("status", "pending")
        .maybeSingle();
      if (!open) {
        await supabaseAdmin.from("approvals").insert({
          kind: "role_request",
          requested_role: requested,
          target_user_id: context.userId,
          subject_line: `${profilePatch["full_name"]} requested the ${requested} role`,
          details: str(v["reason"]) ?? "Submitted during setup.",
          requested_by: state.profileId,
          department_id: (str(v["departmentId"]) as string | null) ?? null,
          status: "pending",
        });
      }
      await supabaseAdmin
        .from("profiles")
        .update({ approval_status: "pending" })
        .eq("id", state.profileId);
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId,
      actor_name: String(profilePatch["full_name"] ?? state.fullName),
      action: "onboarding.completed",
      entity: "profiles",
      entity_id: state.profileId,
      metadata: { role: state.role, requested_role: requested },
    });

    return loadState(context);
  });

/** Institution + academic structure, super admin only. */
export const saveInstitutionSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { values: SetupValues }) => ({
    values: (data?.values ?? {}) as SetupValues,
  }))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _permission: "system.settings",
    });
    if (!allowed) throw new Error("You don't have permission to change institution settings.");
    const v = data.values;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inst } = await supabaseAdmin.from("institution").select("id, settings").limit(1).maybeSingle();
    const settings = {
      ...((inst?.settings as Record<string, unknown>) ?? {}),
      type: str(v["type"]),
      website: str(v["website"]),
      email: str(v["email"]),
      phone: str(v["phone"]),
      address: str(v["address"]),
      city: str(v["city"]),
      state: str(v["state"]),
      country: str(v["country"]),
      logoUrl: str(v["logoUrl"]),
      workingDays: list(v["workingDays"]),
      classStart: str(v["classStart"]),
      classEnd: str(v["classEnd"]),
      semesters: num(v["semesters"]),
      moderation: str(v["moderation"]),
      registrationOpen: v["registrationOpen"] === true,
    };
    if (inst) {
      const patch: Record<string, unknown> = { settings };
      if (str(v["name"])) patch["name"] = str(v["name"]);
      if (str(v["code"])) patch["code"] = str(v["code"])?.toUpperCase();
      await supabaseAdmin.from("institution").update(patch as never).eq("id", inst.id);
    }
    return { ok: true };
  });

export const addDepartmentSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string; code: string }) => ({
    name: String(data?.name ?? "").trim(),
    code: String(data?.code ?? "").trim().toUpperCase(),
  }))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _permission: "departments.manage",
    });
    if (!allowed) throw new Error("You don't have permission to add departments.");
    if (data.name.length < 2 || data.code.length < 2) throw new Error("Enter a department name and code.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("departments").insert({ name: data.name, code: data.code });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSetupDepartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("departments").select("id, name, code").order("name");
    return data ?? [];
  });

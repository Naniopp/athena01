import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles, ArrowLeft, ArrowRight, Loader2, Check, LogOut, Plus, Building2, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getOnboardingState, saveOnboardingStep, completeOnboarding, saveInstitutionSetup,
  addDepartmentSetup, listSetupDepartments, SETUP_SLUG, type SetupValues,
} from "@/lib/rbac/onboarding.functions";
import type { Role } from "@/lib/rbac/matrix";

const SLUG_TO_ROLE: Record<string, Role> = {
  student: "student",
  faculty: "faculty",
  hod: "hod",
  administrator: "admin",
  "super-admin": "super_admin",
};

export const Route = createFileRoute("/setup/$role")({
  ssr: false,
  beforeLoad: async ({ params, location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { next: location.href } });
    if (!SLUG_TO_ROLE[params.role]) throw redirect({ to: "/dashboard" });
  },
  head: ({ params }) => {
    const label = params.role.replace("-", " ");
    return {
      meta: [
        { title: `Complete your ${label} setup · ATHENA` },
        { name: "description", content: `Finish your ATHENA ${label} profile so your workspace is ready.` },
        { property: "og:title", content: `Complete your ${label} setup · ATHENA` },
        { property: "og:description", content: "A short guided setup to finish your ATHENA profile." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SetupRolePage,
});

/* ---------------------------------------------------------------- schema */

type FieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "tags" | "date" | "toggle";

interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  wide?: boolean;
}

interface StepDef {
  title: string;
  subtitle: string;
  fields?: FieldDef[];
  /** Special editor for the super admin academic structure step. */
  departments?: boolean;
  optional?: boolean;
}

const PERSONAL: FieldDef[] = [
  { key: "fullName", label: "Full name", required: true, placeholder: "Alex Johnson" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "gender", label: "Gender", type: "select", options: ["", "Female", "Male", "Other", "Prefer not to say"] },
  { key: "bio", label: "Short bio", type: "textarea", wide: true, placeholder: "A line or two about you." },
];

const STEPS: Record<Role, StepDef[]> = {
  student: [
    { title: "About you", subtitle: "Basic details for your campus profile.", fields: PERSONAL },
    {
      title: "Academic details",
      subtitle: "So your classes, assignments and attendance line up.",
      fields: [
        { key: "rollNo", label: "Roll number", required: true, placeholder: "NU23CS1001" },
        { key: "institution", label: "Institution", placeholder: "Northbridge University" },
        { key: "departmentName", label: "Department", required: true, placeholder: "Computer Science" },
        { key: "programName", label: "Program", placeholder: "B.Tech Computer Science" },
        { key: "academicYear", label: "Year", type: "number", required: true, placeholder: "2" },
        { key: "semester", label: "Semester", type: "number", required: true, placeholder: "3" },
        { key: "section", label: "Section", placeholder: "A" },
        { key: "admissionYear", label: "Admission year", type: "number", placeholder: "2023" },
      ],
    },
    {
      title: "Interests & skills",
      subtitle: "Helps ATHENA suggest communities, events and people.",
      optional: true,
      fields: [
        { key: "interests", label: "Interests", type: "tags", wide: true, help: "Separate with commas", placeholder: "AI, robotics, football" },
        { key: "skills", label: "Skills", type: "tags", wide: true, placeholder: "Python, UI design" },
        { key: "hobbies", label: "Hobbies", type: "tags", wide: true, placeholder: "Photography, chess" },
      ],
    },
    {
      title: "Preferences",
      subtitle: "You can change these any time in settings.",
      optional: true,
      fields: [
        { key: "privacy", label: "Profile visibility", type: "select", options: ["campus", "public", "private"] },
        { key: "emailUpdates", label: "Email me campus updates", type: "toggle" },
      ],
    },
  ],
  faculty: [
    { title: "About you", subtitle: "Basic details for your campus profile.", fields: PERSONAL },
    {
      title: "Professional details",
      subtitle: "Your appointment at the institution.",
      fields: [
        { key: "employeeId", label: "Employee ID", required: true, placeholder: "NU-FAC-1042" },
        { key: "designation", label: "Designation", required: true, placeholder: "Assistant Professor" },
        { key: "departmentName", label: "Department", required: true, placeholder: "Computer Science" },
        { key: "qualification", label: "Highest qualification", placeholder: "Ph.D. Computer Science" },
        { key: "specialisation", label: "Specialisation", placeholder: "Machine learning" },
        { key: "experienceYears", label: "Years of experience", type: "number", placeholder: "8" },
        { key: "joiningYear", label: "Year of joining", type: "number", placeholder: "2019" },
      ],
    },
    {
      title: "Teaching",
      subtitle: "What you teach and where students can find you.",
      fields: [
        { key: "subjects", label: "Subjects", type: "tags", wide: true, placeholder: "Data Structures, Algorithms" },
        { key: "programs", label: "Programs", type: "tags", wide: true, placeholder: "B.Tech CSE, M.Tech AI" },
        { key: "officeRoom", label: "Office / room", placeholder: "Block B, 204" },
        { key: "officeHours", label: "Office hours", placeholder: "Mon–Thu, 3–5 pm" },
      ],
    },
    {
      title: "Expertise",
      subtitle: "Optional, but it makes collaboration easier.",
      optional: true,
      fields: [
        { key: "expertise", label: "Areas of expertise", type: "tags", wide: true, placeholder: "NLP, computer vision" },
        { key: "researchInterests", label: "Research interests", type: "tags", wide: true, placeholder: "Explainable AI" },
        { key: "privacy", label: "Profile visibility", type: "select", options: ["campus", "public", "private"] },
      ],
    },
  ],
  hod: [
    { title: "About you", subtitle: "Basic details for your campus profile.", fields: PERSONAL },
    {
      title: "Professional details",
      subtitle: "Your appointment at the institution.",
      fields: [
        { key: "employeeId", label: "Employee ID", required: true, placeholder: "NU-FAC-0101" },
        { key: "designation", label: "Designation", required: true, placeholder: "Professor & Head" },
        { key: "qualification", label: "Highest qualification", placeholder: "Ph.D." },
        { key: "experienceYears", label: "Years of experience", type: "number", placeholder: "15" },
        { key: "joiningYear", label: "Year of joining", type: "number", placeholder: "2012" },
      ],
    },
    {
      title: "Department & responsibilities",
      subtitle: "The department you would lead.",
      fields: [
        { key: "departmentName", label: "Department", required: true, placeholder: "Computer Science" },
        { key: "departmentCode", label: "Department code", placeholder: "CSE" },
        { key: "programs", label: "Programs under you", type: "tags", wide: true, placeholder: "B.Tech CSE, M.Tech AI" },
        { key: "responsibilities", label: "Responsibilities", type: "textarea", wide: true, placeholder: "Academic planning, faculty allocation…" },
      ],
    },
    {
      title: "Verification",
      subtitle: "A super admin reviews this before the role is granted.",
      fields: [
        { key: "reason", label: "Why you need head of department access", type: "textarea", wide: true, required: true, placeholder: "Appointed head of the CSE department from July 2026." },
        { key: "verificationRef", label: "Reference or appointment letter number", placeholder: "NU/APPT/2026/119" },
      ],
    },
  ],
  admin: [
    { title: "About you", subtitle: "Basic details for your campus profile.", fields: PERSONAL },
    {
      title: "Professional details",
      subtitle: "Your role at the institution.",
      fields: [
        { key: "employeeId", label: "Employee ID", required: true, placeholder: "NU-ADM-0042" },
        { key: "designation", label: "Designation", required: true, placeholder: "Registrar" },
        { key: "institution", label: "Institution", placeholder: "Northbridge University" },
        { key: "experienceYears", label: "Years of experience", type: "number", placeholder: "10" },
      ],
    },
    {
      title: "Responsibilities",
      subtitle: "What you will be managing on ATHENA.",
      fields: [
        { key: "adminDepartment", label: "Administrative area", placeholder: "Examinations" },
        { key: "requestedAreas", label: "Access areas needed", type: "tags", wide: true, placeholder: "Users, Moderation, Announcements" },
        { key: "responsibilities", label: "Responsibilities", type: "textarea", wide: true, placeholder: "Student records, admissions, compliance…" },
      ],
    },
    {
      title: "Verification",
      subtitle: "A super admin reviews this before the role is granted.",
      fields: [
        { key: "reason", label: "Why you need administrator access", type: "textarea", wide: true, required: true, placeholder: "Registrar's office manages campus-wide records." },
        { key: "verificationRef", label: "Reference or appointment letter number", placeholder: "NU/APPT/2026/077" },
      ],
    },
  ],
  super_admin: [
    { title: "About you", subtitle: "Basic details for your owner profile.", fields: PERSONAL },
    {
      title: "Institution",
      subtitle: "How ATHENA presents your campus.",
      fields: [
        { key: "name", label: "Institution name", required: true, placeholder: "Northbridge University" },
        { key: "code", label: "Institution code", required: true, placeholder: "NBU" },
        { key: "type", label: "Type", type: "select", options: ["University", "College", "Institute", "School"] },
        { key: "website", label: "Website", placeholder: "https://northbridge.edu" },
        { key: "email", label: "Contact email", type: "email", placeholder: "info@northbridge.edu" },
        { key: "institutionPhone", label: "Contact phone", type: "tel", placeholder: "+91 22 4000 1000" },
        { key: "address", label: "Address", wide: true, placeholder: "12 Campus Road" },
        { key: "city", label: "City", placeholder: "Mumbai" },
        { key: "state", label: "State", placeholder: "Maharashtra" },
        { key: "country", label: "Country", placeholder: "India" },
      ],
    },
    { title: "Academic structure", subtitle: "Add the departments on your campus. You can add more later.", departments: true },
    {
      title: "Academic configuration",
      subtitle: "Defaults used across timetables and terms.",
      optional: true,
      fields: [
        { key: "semesters", label: "Semesters per year", type: "number", placeholder: "2" },
        { key: "workingDays", label: "Working days", type: "tags", wide: true, placeholder: "Mon, Tue, Wed, Thu, Fri" },
        { key: "classStart", label: "First class starts", placeholder: "09:00" },
        { key: "classEnd", label: "Last class ends", placeholder: "17:00" },
      ],
    },
    {
      title: "Platform settings",
      subtitle: "How members join and how content is handled.",
      optional: true,
      fields: [
        { key: "registrationOpen", label: "Allow new sign-ups", type: "toggle" },
        { key: "moderation", label: "Content moderation", type: "select", options: ["Review reported content", "Pre-approve posts", "Off"] },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- inputs */

const box =
  "mt-2 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 transition focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20";

function FieldInput({
  def, value, onChange,
}: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const type = def.type ?? "text";
  return (
    <div className={def.wide ? "sm:col-span-2" : ""}>
      <label className="text-sm font-medium text-foreground">
        {def.label}
        {def.required ? <span className="text-[#F97316]"> *</span> : <span className="text-muted-foreground"> · optional</span>}
      </label>
      {type === "textarea" ? (
        <div className={box}>
          <textarea
            rows={3}
            value={value}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full resize-y bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      ) : type === "select" ? (
        <div className={box}>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-sm capitalize outline-none"
          >
            {(def.options ?? []).map((o) => (
              <option key={o} value={o}>{o === "" ? "Select…" : o}</option>
            ))}
          </select>
        </div>
      ) : type === "toggle" ? (
        <button
          type="button"
          onClick={() => onChange(value === "true" ? "false" : "true")}
          className={`mt-2 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
            value === "true" ? "border-[#F97316] bg-[#F97316]/5 text-foreground" : "border-border bg-white text-muted-foreground"
          }`}
        >
          <span className={`grid h-5 w-5 place-items-center rounded-full ${value === "true" ? "bg-[#F97316] text-white" : "bg-muted"}`}>
            {value === "true" ? <Check className="h-3 w-3" /> : null}
          </span>
          {value === "true" ? "On" : "Off"}
        </button>
      ) : (
        <div className={box}>
          <input
            type={type === "tags" ? "text" : type}
            value={value}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
      {def.help && <p className="mt-1 text-xs text-muted-foreground">{def.help}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- page */

function SetupRolePage() {
  const { role: slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchState = useServerFn(getOnboardingState);
  const saveStep = useServerFn(saveOnboardingStep);
  const complete = useServerFn(completeOnboarding);
  const saveInstitution = useServerFn(saveInstitutionSetup);
  const addDepartment = useServerFn(addDepartmentSetup);
  const listDepartments = useServerFn(listSetupDepartments);

  const state = useQuery({
    queryKey: ["athena", "onboarding"],
    queryFn: () => fetchState(),
    retry: false,
  });

  const sessionRole = state.data?.setupRole;
  const steps = useMemo<StepDef[]>(() => (sessionRole ? STEPS[sessionRole] : []), [sessionRole]);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Send people to the setup screen that matches their real role.
  useEffect(() => {
    if (!state.data) return;
    if (state.data.onboardingStatus === "completed") {
      navigate({ href: state.data.redirectTo });
      return;
    }
    const correct = SETUP_SLUG[state.data.setupRole];
    if (slug !== correct) navigate({ to: "/setup/$role", params: { role: correct } });
  }, [state.data, slug, navigate]);

  // Prefill from the saved draft once.
  useEffect(() => {
    if (!state.data || hydrated) return;
    const saved = state.data.setupData as Record<string, unknown>;
    const seed: Record<string, string> = {};
    for (const [k, v] of Object.entries(saved)) {
      if (k.startsWith("__")) continue;
      seed[k] = Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "" : String(v);
    }
    seed["fullName"] ||= state.data.fullName ?? "";
    seed["phone"] ||= state.data.phone ?? "";
    setValues(seed);
    const savedStep = Number(saved["__step"] ?? 0);
    setStep(Number.isFinite(savedStep) ? Math.min(Math.max(savedStep, 0), Math.max(steps.length - 1, 0)) : 0);
    setHydrated(true);
  }, [state.data, hydrated, steps.length]);

  const departments = useQuery({
    queryKey: ["athena", "setup-departments"],
    queryFn: () => listDepartments(),
    enabled: !!steps[step]?.departments,
  });
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  const current = steps[step];
  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  function missing(): string | null {
    for (const f of current?.fields ?? []) {
      if (f.required && !(values[f.key] ?? "").trim()) return `Please fill in “${f.label}”.`;
    }
    return null;
  }

  function payload(): SetupValues {
    const out: SetupValues = {};
    for (const s of steps) {
      for (const f of s.fields ?? []) {
        const raw = (values[f.key] ?? "").trim();
        if (f.type === "toggle") out[f.key] = raw === "true";
        else if (f.type === "tags") out[f.key] = raw ? raw.split(",").map((x) => x.trim()).filter(Boolean) : [];
        else if (f.type === "number") out[f.key] = raw ? Number(raw) : null;
        else out[f.key] = raw;
      }
    }
    return out;
  }

  async function persist(nextStep: number) {
    await saveStep({ data: { values: payload(), step: nextStep } });
    qc.invalidateQueries({ queryKey: ["athena", "onboarding"] });
  }

  async function onContinue() {
    setError(null);
    const m = missing();
    if (m) { setError(m); return; }
    setBusy(true);
    try {
      if (step < steps.length - 1) {
        await persist(step + 1);
        setStep(step + 1);
        toast.success("Progress saved");
      } else {
        if (sessionRole === "super_admin") {
          await saveInstitution({ data: { values: { ...payload(), phone: values["institutionPhone"] ?? "" } } });
        }
        const done = await complete({ data: { values: payload() } });
        qc.invalidateQueries({ queryKey: ["athena", "session"] });
        toast.success("Setup complete");
        navigate({ href: done.redirectTo });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveExit() {
    setBusy(true);
    try {
      await persist(step);
      toast.success("Saved — you can finish this later");
      navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your progress.");
    } finally {
      setBusy(false);
    }
  }

  async function onAddDepartment() {
    if (!deptName.trim() || !deptCode.trim()) { setError("Enter a department name and code."); return; }
    setBusy(true);
    try {
      await addDepartment({ data: { name: deptName, code: deptCode } });
      setDeptName(""); setDeptCode("");
      departments.refetch();
      toast.success("Department added");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the department.");
    } finally {
      setBusy(false);
    }
  }

  const pct = steps.length ? Math.round(((step + (current ? 0 : 1)) / steps.length) * 100) : 0;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#F97316]/10 blur-3xl" />
      <header className="relative mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
            <Sparkles className="h-4 w-4 text-[#F97316]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login", search: {} }); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <main className="relative mx-auto max-w-4xl px-6 pb-24">
        {state.isLoading && (
          <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#F97316]" /></div>
        )}
        {state.isError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            We couldn't load your setup. Please refresh the page.
          </p>
        )}

        {state.data && current && (
          <div className="rounded-3xl border border-border bg-white p-8 shadow-elegant sm:p-10">
            {/* progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Step {step + 1} of {steps.length}</span>
              <span className="text-muted-foreground">{pct}% complete</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#F97316] transition-all" style={{ width: `${Math.max(pct, 6)}%` }} />
            </div>

            <div className="mt-7">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{current.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>
            </div>

            {current.departments ? (
              <div className="mt-8">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <div className={box + " mt-0"}>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="Computer Science"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  </div>
                  <div className={box + " mt-0"}>
                    <input value={deptCode} onChange={(e) => setDeptCode(e.target.value.toUpperCase())} placeholder="CSE"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  </div>
                  <button type="button" onClick={onAddDepartment} disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-40">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
                <ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {(departments.data ?? []).map((d) => (
                    <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-medium text-foreground">{d.name}</span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{d.code}</span>
                    </li>
                  ))}
                  {(departments.data ?? []).length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">No departments yet.</li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {(current.fields ?? []).map((f) => (
                  <FieldInput key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
                ))}
              </div>
            )}

            {(sessionRole === "hod" || sessionRole === "admin") && step === steps.length - 1 && (
              <p className="mt-7 flex items-start gap-2 rounded-2xl border border-border bg-[#FAFAFA] p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F97316]" />
                <span>
                  When you finish, your request goes to a super admin. Until it's approved you'll see a
                  pending screen instead of the {sessionRole === "hod" ? "department" : "administration"} workspace.
                </span>
              </p>
            )}

            {error && (
              <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={step === 0 || busy}
                  onClick={() => { setError(null); setStep(step - 1); }}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition enabled:hover:bg-muted/60 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSaveExit}
                  className="rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition enabled:hover:text-foreground disabled:opacity-40"
                >
                  Save &amp; exit
                </button>
              </div>

              <div className="flex items-center gap-3">
                {current.optional && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setError(null); if (step < steps.length - 1) { setStep(step + 1); } else { onContinue(); } }}
                    className="rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition enabled:hover:text-foreground disabled:opacity-40"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={onContinue}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition enabled:hover:brightness-105 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {step < steps.length - 1 ? "Save & continue" : "Finish setup"}
                  <ArrowRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

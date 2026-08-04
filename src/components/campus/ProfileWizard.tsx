import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Btn, Modal } from "./ui";
import { useCampus } from "@/lib/campus/store";

const DONE_KEY = "athena.profile-complete-v1";
const DRAFT_KEY = "athena.profile-draft-v1";
const SNOOZE_KEY = "athena.profile-snoozed-v1";

export function isProfileComplete(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DONE_KEY) === "1";
}

type Draft = {
  step: number;
  name: string;
  rollNo: string;
  department: string;
  semester: string;
  bio: string;
  skills: string;
  interests: string[];
  github: string;
  linkedin: string;
  savedAt: string;
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (typeof d?.step !== "number") return null;
    return d;
  } catch {
    return null;
  }
}

/** True when a partially-filled wizard draft is waiting to be resumed. */
export function hasProfileDraft(): boolean {
  const d = readDraft();
  return !!d && (d.step > 0 || !!d.name || !!d.rollNo || d.interests?.length > 0);
}

export function clearProfileDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
  window.sessionStorage.removeItem(SNOOZE_KEY);
}

const DEPTS = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Information Technology",
  "Business Administration",
];

const INTERESTS = ["AI/ML", "Web Dev", "Robotics", "Design", "Finance", "Research", "Sports", "Music", "Entrepreneurship"];

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

/** Multi-step profile completion wizard. Progress is saved on every change so
 *  the user can exit at any point and resume exactly where they left off. */
export function ProfileWizard() {
  const profile = useCampus((s) => s.profile);
  const setProfile = useCampus((s) => s.setProfile);

  const draft = useRef<Draft | null>(null);
  if (draft.current === null) draft.current = readDraft();
  const d = draft.current;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(d?.step ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);

  const [name, setName] = useState(d?.name ?? profile.name);
  const [rollNo, setRollNo] = useState(d?.rollNo ?? profile.rollNo);
  const [department, setDepartment] = useState(d?.department ?? profile.department);
  const [semester, setSemester] = useState(d?.semester ?? String(profile.semester));
  const [bio, setBio] = useState(d?.bio ?? profile.bio);
  const [skills, setSkills] = useState(d?.skills ?? profile.skills.join(", "));
  const [interests, setInterests] = useState<string[]>(d?.interests ?? profile.interests);
  const [github, setGithub] = useState(d?.github ?? profile.links.github);
  const [linkedin, setLinkedin] = useState(d?.linkedin ?? profile.links.linkedin);

  useEffect(() => {
    if (isProfileComplete()) return;
    if (window.sessionStorage.getItem(SNOOZE_KEY) === "1") return;
    setOpen(true);
    if (hasProfileDraft()) setResumed(true);
  }, []);

  // Autosave the draft so exiting never loses entered steps.
  useEffect(() => {
    if (typeof window === "undefined" || isProfileComplete()) return;
    const payload: Draft = {
      step, name, rollNo, department, semester, bio, skills, interests, github, linkedin,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [step, name, rollNo, department, semester, bio, skills, interests, github, linkedin]);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const next = () => {
    setError(null);
    setResumed(false);
    if (step === 0) {
      if (name.trim().length < 2) return setError("Enter your full name.");
      if (!rollNo.trim()) return setError("Enter your roll number.");
      const sem = Number(semester);
      if (!Number.isFinite(sem) || sem < 1 || sem > 10) return setError("Semester must be between 1 and 10.");
      setProfile({ name: name.trim(), rollNo: rollNo.trim(), department, semester: Number(semester) });
      setStep(1);
      return;
    }
    if (step === 1) {
      if (interests.length === 0) return setError("Pick at least one interest so Athena can personalise your feed.");
      setProfile({
        interests,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setStep(2);
      return;
    }
    setProfile({ bio: bio.trim(), links: { ...profile.links, github: github.trim(), linkedin: linkedin.trim() } });
    window.localStorage.setItem(DONE_KEY, "1");
    clearProfileDraft();
    setOpen(false);
    toast.success("Profile completed", { description: "Your dashboard is now personalised." });
  };

  /** Exit without losing anything: draft stays, wizard is snoozed for this session. */
  const finishLater = () => {
    window.sessionStorage.setItem(SNOOZE_KEY, "1");
    setOpen(false);
    toast.message("Progress saved", {
      description: `We saved step ${step + 1} of 3 — resume anytime from Settings → Profile.`,
    });
  };

  return (
    <Modal open={open} onClose={finishLater} title="Complete your profile">
      <div className="mb-5 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-[var(--accent)]" : "bg-muted"}`}
          />
        ))}
      </div>

      {resumed && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-xs text-foreground">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span>
            Welcome back — we picked up right where you left off at step {step + 1} of 3. Everything you entered is still here.
          </span>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Step 1 of 3 — the basics we'll show on your campus profile.</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Roll number</span>
              <input className={field} value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="21CSE1042" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Semester</span>
              <input className={field} value={semester} onChange={(e) => setSemester(e.target.value)} inputMode="numeric" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Department</span>
            <select className={field} value={department} onChange={(e) => setDepartment(e.target.value)}>
              {[...new Set([profile.department, ...DEPTS])].map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Step 2 of 3 — what you're into. Athena uses this to rank your feed.</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = interests.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    on
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {on && <Check className="mr-1 inline h-3 w-3" />}
                  {i}
                </button>
              );
            })}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Skills (comma separated)</span>
            <input className={field} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="TypeScript, Python, Figma" />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Step 3 of 3 — a short intro and your links.</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Bio</span>
            <textarea className={`${field} min-h-[90px] resize-none`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Final-year CSE student building AI tools for campus life." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">GitHub</span>
              <input className={field} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/you" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">LinkedIn</span>
              <input className={field} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/you" />
            </label>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        {step > 0 ? (
          <Btn variant="outline" size="sm" onClick={() => { setError(null); setResumed(false); setStep((s) => s - 1); }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Btn>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <button onClick={finishLater} className="text-xs text-muted-foreground hover:text-foreground">
            Save &amp; finish later
          </button>
          <Btn variant="accent" size="sm" onClick={next}>
            {step === 2 ? (<><Sparkles className="h-3.5 w-3.5" /> Finish</>) : (<>Continue <ArrowRight className="h-3.5 w-3.5" /></>)}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Github, Linkedin, Globe, Plus, X, Pencil, GraduationCap, BarChart3, Activity } from "lucide-react";
import { toast } from "sonner";
import { useCampus } from "@/lib/campus/store";
import { Card, PageHeader, Field, Btn, Badge, timeAgo } from "@/components/campus/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/student/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — ATHENA" },
      { name: "description", content: "Manage your ATHENA campus profile, skills, and links." },
      { property: "og:title", content: "Profile — ATHENA" },
      { property: "og:description", content: "Manage your ATHENA campus profile, skills, and links." },
    ],
  }),
});

function isValidUrl(v: string) {
  if (!v) return true;
  return /^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(v.replace(/^https?:\/\//, ""));
}

function ProfilePage() {
  const profile = useCampus((s) => s.profile);
  const setProfile = useCampus((s) => s.setProfile);
  const posts = useCampus((s) => s.posts);
  const notifications = useCampus((s) => s.notifications);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const onPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ photo: String(reader.result) });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const startEdit = () => { setDraft(profile); setErrors({}); setEditing(true); };

  const save = () => {
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = "Name is required";
    if (!draft.department.trim()) errs.department = "Department is required";
    if (!draft.rollNo.trim()) errs.rollNo = "Roll number is required";
    if (draft.semester < 1 || draft.semester > 12) errs.semester = "Semester must be 1–12";
    if (draft.cgpa < 0 || draft.cgpa > 10) errs.cgpa = "CGPA must be 0–10";
    if (!isValidUrl(draft.links.github)) errs.github = "Invalid URL";
    if (!isValidUrl(draft.links.linkedin)) errs.linkedin = "Invalid URL";
    if (!isValidUrl(draft.links.website)) errs.website = "Invalid URL";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setProfile(draft);
    setEditing(false);
    toast.success("Profile updated");
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!profile.skills.includes(v)) setProfile({ skills: [...profile.skills, v] });
    setSkillInput("");
  };
  const removeSkill = (v: string) => setProfile({ skills: profile.skills.filter((s) => s !== v) });
  const addInterest = () => {
    const v = interestInput.trim();
    if (!v) return;
    if (!profile.interests.includes(v)) setProfile({ interests: [...profile.interests, v] });
    setInterestInput("");
  };
  const removeInterest = (v: string) => setProfile({ interests: profile.interests.filter((s) => s !== v) });

  const timeline = useMemo(() => {
    const items = [
      ...posts.filter((p) => p.own).map((p) => ({ id: p.id, at: p.createdAt, label: `Posted: "${p.body.slice(0, 60)}"` })),
      ...notifications.slice(0, 6).map((n) => ({ id: n.id, at: n.at, label: n.title })),
    ];
    return items.sort((a, b) => b.at - a.at).slice(0, 8);
  }, [posts, notifications]);

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="How campus sees you."
        action={!editing ? <Btn variant="accent" onClick={startEdit}><Pencil className="h-4 w-4" /> Edit profile</Btn> : (
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setEditing(false)}>Cancel</Btn>
            <Btn variant="accent" onClick={save}>Save</Btn>
          </div>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="group relative">
              <img src={profile.photo} alt={profile.name} className="h-24 w-24 rounded-full border border-border object-cover" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow"
                aria-label="Change photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
            </div>
            {editing ? (
              <div className="mt-4 w-full space-y-3 text-left">
                <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} error={errors.name} />
                <Field label="Bio" value={draft.bio} onChange={(v) => setDraft({ ...draft, bio: v })} textarea maxLength={200} />
              </div>
            ) : (
              <>
                <p className="mt-4 text-lg font-semibold text-foreground">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
              </>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><GraduationCap className="h-4 w-4 text-[var(--accent)]" /> Academic details</p>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department" value={draft.department} onChange={(v) => setDraft({ ...draft, department: v })} error={errors.department} />
              <Field label="Roll number" value={draft.rollNo} onChange={(v) => setDraft({ ...draft, rollNo: v })} error={errors.rollNo} />
              <Field label="Semester" type="number" value={String(draft.semester)} onChange={(v) => setDraft({ ...draft, semester: Number(v) || 0 })} error={errors.semester} />
              <Field label="CGPA" type="number" value={String(draft.cgpa)} onChange={(v) => setDraft({ ...draft, cgpa: Number(v) || 0 })} error={errors.cgpa} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <p><span className="text-muted-foreground">Department: </span><span className="text-foreground">{profile.department}</span></p>
              <p><span className="text-muted-foreground">Roll number: </span><span className="text-foreground">{profile.rollNo}</span></p>
              <p><span className="text-muted-foreground">Semester: </span><span className="text-foreground">{profile.semester}</span></p>
              <p><span className="text-muted-foreground">CGPA: </span><span className="text-foreground">{profile.cgpa}</span></p>
            </div>
          )}

          <p className="mb-3 mt-6 text-sm font-semibold text-foreground">Links</p>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="GitHub" value={draft.links.github} onChange={(v) => setDraft({ ...draft, links: { ...draft.links, github: v } })} error={errors.github} />
              <Field label="LinkedIn" value={draft.links.linkedin} onChange={(v) => setDraft({ ...draft, links: { ...draft.links, linkedin: v } })} error={errors.linkedin} />
              <Field label="Website" value={draft.links.website} onChange={(v) => setDraft({ ...draft, links: { ...draft.links, website: v } })} error={errors.website} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 text-sm">
              {profile.links.github && <a className="flex items-center gap-1.5 text-foreground hover:text-[var(--accent)]" href={`https://${profile.links.github.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer"><Github className="h-4 w-4" />{profile.links.github}</a>}
              {profile.links.linkedin && <a className="flex items-center gap-1.5 text-foreground hover:text-[var(--accent)]" href={`https://${profile.links.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" />{profile.links.linkedin}</a>}
              {profile.links.website && <a className="flex items-center gap-1.5 text-foreground hover:text-[var(--accent)]" href={`https://${profile.links.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" />{profile.links.website}</a>}
              {!profile.links.github && !profile.links.linkedin && !profile.links.website && <p className="text-xs text-muted-foreground">No links added yet.</p>}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Skills</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                {s}<button onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}><X className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} placeholder="Add a skill" className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none" />
            <Btn size="sm" variant="outline" onClick={addSkill}><Plus className="h-3.5 w-3.5" /></Btn>
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-sm font-semibold text-foreground">Interests</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.interests.map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
                {s}<button onClick={() => removeInterest(s)} aria-label={`Remove ${s}`}><X className="h-3 w-3 hover:text-destructive" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={interestInput} onChange={(e) => setInterestInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addInterest()} placeholder="Add an interest" className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none" />
            <Btn size="sm" variant="outline" onClick={addInterest}><Plus className="h-3.5 w-3.5" /></Btn>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><p className="text-xs text-muted-foreground">CGPA</p><p className="mt-1 text-2xl font-semibold text-foreground">{profile.cgpa}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Attendance</p><p className="mt-1 text-2xl font-semibold text-foreground">84%</p></Card>
        <Card><p className="text-xs text-muted-foreground">Credits earned</p><p className="mt-1 text-2xl font-semibold text-foreground">86</p></Card>
      </div>

      <Card className="mt-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="h-4 w-4 text-[var(--accent)]" /> Recent activity</p>
        {timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent activity yet.</p>
        ) : (
          <ol className="space-y-4 border-l border-border pl-4">
            {timeline.map((t) => (
              <li key={t.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                <p className="text-sm text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{timeAgo(t.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

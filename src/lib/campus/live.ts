// Live data layer for the campus dashboards.
// Reads the signed-in member's real records (RLS applies) and maps them into
// the shapes the pages already render. Writes go straight to the database.
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Post, Comment, Course, Assignment, AttendanceRecord, CalendarItem, Conversation,
  Club, CampusEvent, Book, Job, Paper, Achievement, PostCategory, PostKind,
} from "./seed";

const AV = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffedd5`;
const PALETTE = ["#F97316", "#0EA5E9", "#22C55E", "#A855F7", "#EF4444", "#EAB308", "#14B8A6"];
const colorFor = (s: string) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
const ymd = (d: string | Date) => new Date(d).toISOString().slice(0, 10);
const hm = (d: string | Date) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export interface LiveSnapshot {
  profileId: string | null;
  profile: {
    name: string; email: string; department: string; semester: number; bio: string; photo: string;
    skills: string[]; interests: string[]; links: { github: string; linkedin: string; website: string };
    cgpa: number; rollNo: string;
  };
  posts: Post[]; likedPosts: string[]; bookmarkedPosts: string[];
  notifications: { id: string; title: string; body: string; kind: any; at: number; read: boolean }[];
  conversations: Conversation[];
  clubs: Club[]; joinedClubs: string[];
  events: CampusEvent[]; registeredEvents: string[];
  courses: Course[]; assignments: Assignment[]; attendance: AttendanceRecord[];
  submissions: Record<string, { fileName: string; size: number; at: number }>;
  calendar: CalendarItem[]; reminders: CalendarItem[];
  books: Book[]; reservedBooks: { id: string; at: number; due: number; loanId: string }[];
  borrowHistory: { id: string; title: string; borrowed: string; returned: string }[];
  jobs: Job[]; appliedJobs: { id: string; at: number }[]; savedJobs: string[];
  papers: Paper[]; bookmarkedPapers: string[];
  achievements: Achievement[];
  settings?: { theme: "light" | "dark"; language: string; timezone: string; reduceMotion: boolean; largeText: boolean; notif?: any };
}

let cachedProfileId: string | null = null;
export async function myProfileId(): Promise<string | null> {
  if (cachedProfileId) return cachedProfileId;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("profiles").select("id").eq("user_id", u.user.id).maybeSingle();
  cachedProfileId = data?.id ?? null;
  return cachedProfileId;
}
supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_OUT" || e === "SIGNED_IN") cachedProfileId = null; });

const rows = <T,>(r: { data: T[] | null }) => r.data ?? [];

export async function loadCampus(): Promise<LiveSnapshot | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: me } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
  if (!me) return null;
  cachedProfileId = me.id;
  const pid = me.id;

  const [sp, dept, posts, likes, marks, notes, convMem, comms, myComms, events, myRegs, enr, subs, att,
    reminders, books, loans, jobs, apps, papers, pbm, ach, prefs, exams] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("profile_id", pid).maybeSingle(),
    me.department_id ? supabase.from("departments").select("name").eq("id", me.department_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("posts").select("*").eq("removed", false).order("created_at", { ascending: false }).limit(60),
    supabase.from("post_likes").select("post_id").eq("profile_id", pid),
    supabase.from("bookmarks").select("post_id").eq("profile_id", pid),
    supabase.from("notifications").select("*").eq("profile_id", pid).order("created_at", { ascending: false }).limit(50),
    supabase.from("conversation_members").select("conversation_id, last_read_at").eq("profile_id", pid),
    supabase.from("communities").select("*").eq("suspended", false).order("name"),
    supabase.from("community_members").select("community_id").eq("profile_id", pid),
    supabase.from("events").select("*").order("starts_at"),
    supabase.from("event_registrations").select("event_id").eq("profile_id", pid),
    supabase.from("enrollments").select("subject_id").eq("student_profile_id", pid),
    supabase.from("submissions").select("assignment_id, file_name, submitted_at, marks").eq("student_profile_id", pid),
    supabase.from("attendance_records").select("subject_id, status, session_date").eq("student_profile_id", pid),
    supabase.from("reminders").select("*").eq("profile_id", pid).order("due_at"),
    supabase.from("library_books").select("*").order("title"),
    supabase.from("book_loans").select("*").eq("profile_id", pid).order("reserved_at", { ascending: false }),
    supabase.from("job_openings").select("*").order("apply_by"),
    supabase.from("job_applications").select("*").eq("profile_id", pid),
    supabase.from("research_papers").select("*").order("year", { ascending: false }),
    supabase.from("paper_bookmarks").select("paper_id").eq("profile_id", pid),
    supabase.from("achievements").select("*").eq("profile_id", pid).order("awarded_on", { ascending: false }),
    supabase.from("user_preferences").select("*").eq("profile_id", pid).maybeSingle(),
    supabase.from("exams").select("*").order("exam_date"),
  ]);

  // ---------- people lookup (authors, members) ----------
  const postRows = rows(posts as any) as any[];
  const postIds = postRows.map((p) => p.id);
  const commentRows = postIds.length
    ? rows(await supabase.from("comments").select("*").in("post_id", postIds).eq("removed", false).order("created_at") as any) as any[]
    : [];
  const convIds = rows(convMem as any).map((c: any) => c.conversation_id);
  const [convs, allMembers, msgs] = convIds.length
    ? await Promise.all([
        supabase.from("conversations").select("*").in("id", convIds),
        supabase.from("conversation_members").select("conversation_id, profile_id").in("conversation_id", convIds),
        supabase.from("messages").select("*").in("conversation_id", convIds).order("created_at"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const people = new Set<string>([
    ...postRows.map((p) => p.author_profile_id),
    ...commentRows.map((c) => c.author_profile_id),
    ...rows(allMembers as any).map((m: any) => m.profile_id),
  ]);
  const { data: ppl } = people.size
    ? await supabase.from("profiles").select("id, full_name, photo_url, designation").in("id", [...people])
    : { data: [] as any[] };
  const P = new Map((ppl ?? []).map((p: any) => [p.id, p]));
  const nameOf = (id: string) => P.get(id)?.full_name ?? "Campus member";
  const photoOf = (id: string) => P.get(id)?.photo_url || AV(nameOf(id));

  // ---------- feed ----------
  const buildComments = (postId: string): Comment[] => {
    const list = commentRows.filter((c) => c.post_id === postId);
    const toC = (c: any): Comment => ({
      id: c.id, author: nameOf(c.author_profile_id), avatar: photoOf(c.author_profile_id), body: c.body,
      createdAt: new Date(c.created_at).getTime(),
      replies: list.filter((r) => r.parent_id === c.id).map(toC),
    });
    return list.filter((c) => !c.parent_id).map(toC);
  };
  const feed: Post[] = postRows.map((p) => {
    const meta = (p.event_meta ?? {}) as any;
    const kind: PostKind = (["text", "image", "poll", "announcement", "event"].includes(p.kind) ? p.kind : "text") as PostKind;
    return {
      id: p.id, author: nameOf(p.author_profile_id), authorRole: P.get(p.author_profile_id)?.designation ?? "Member",
      avatar: photoOf(p.author_profile_id),
      category: (meta.category ?? (p.kind === "announcement" ? "Announcements" : "Academics")) as PostCategory,
      kind, body: p.body, image: p.image_url ?? undefined,
      poll: p.poll ?? undefined, eventMeta: meta.title ? { title: meta.title, date: meta.date, venue: meta.venue } : undefined,
      createdAt: new Date(p.created_at).getTime(), likes: p.like_count, shares: p.share_count,
      comments: buildComments(p.id), own: p.author_profile_id === pid,
    };
  });

  // ---------- messages ----------
  const msgRows = rows(msgs as any) as any[];
  const lastRead = new Map(rows(convMem as any).map((c: any) => [c.conversation_id, c.last_read_at]));
  const conversations: Conversation[] = (rows(convs as any) as any[]).map((c) => {
    const members = rows(allMembers as any).filter((m: any) => m.conversation_id === c.id && m.profile_id !== pid) as any[];
    const name = c.title || members.map((m) => nameOf(m.profile_id)).join(", ") || "Conversation";
    const mine = msgRows.filter((m) => m.conversation_id === c.id);
    const lr = lastRead.get(c.id);
    return {
      id: c.id, name, avatar: members[0] ? photoOf(members[0].profile_id) : AV(name),
      kind: c.is_group ? "group" : "dm", members: members.length + 1,
      unread: mine.filter((m) => m.sender_profile_id !== pid && (!lr || m.created_at > lr)).length,
      messages: mine.map((m) => ({
        id: m.id, from: m.sender_profile_id === pid ? "me" : "them", body: m.body, at: new Date(m.created_at).getTime(),
        attachment: m.attachment_name ? { name: m.attachment_name, kind: "file" as const } : undefined,
      })),
    };
  });

  // ---------- clubs & events ----------
  const evRows = rows(events as any) as any[];
  const clubs: Club[] = (rows(comms as any) as any[]).map((c) => ({
    id: c.id, name: c.name, tagline: c.description?.split(".")[0] ?? "", category: "Community",
    members: 0, cover: colorFor(c.name), about: c.description ?? "", gallery: c.cover_url ? [c.cover_url] : [],
    events: evRows.filter((e) => e.community_id === c.id).map((e) => ({ id: e.id, title: e.title, date: ymd(e.starts_at) })),
    announcements: [],
  }));
  if (clubs.length) {
    const { data: cm } = await supabase.from("community_members").select("community_id").in("community_id", clubs.map((c) => c.id));
    for (const r of cm ?? []) { const c = clubs.find((x) => x.id === (r as any).community_id); if (c) c.members++; }
  }
  const campusEvents: CampusEvent[] = evRows.map((e) => ({
    id: e.id, title: e.title, date: ymd(e.starts_at), time: hm(e.starts_at), venue: e.venue ?? "TBA",
    category: e.community_id ? "Club" : "Campus", seats: e.capacity ?? 100, registered: 0,
    about: e.description ?? "", cover: colorFor(e.title),
  }));

  // ---------- academics ----------
  const subjectIds = rows(enr as any).map((e: any) => e.subject_id);
  const [subjects, mats, asg, fa] = subjectIds.length
    ? await Promise.all([
        supabase.from("subjects").select("*").in("id", subjectIds),
        supabase.from("course_materials").select("*").in("subject_id", subjectIds),
        supabase.from("assignments").select("*").in("subject_id", subjectIds).eq("published", true).order("due_at"),
        supabase.from("faculty_assignments").select("subject_id, faculty_profile_id").in("subject_id", subjectIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const facIds = [...new Set(rows(fa as any).map((f: any) => f.faculty_profile_id))];
  const { data: facs } = facIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", facIds)
    : { data: [] as any[] };
  const attRows = rows(att as any) as any[];
  const subRows = rows(subs as any) as any[];
  const asgRows = rows(asg as any) as any[];
  const courses: Course[] = (rows(subjects as any) as any[]).map((s) => {
    const f = (facs ?? []).find((x: any) => rows(fa as any).some((r: any) => r.subject_id === s.id && r.faculty_profile_id === x.id)) as any;
    const a = attRows.filter((r) => r.subject_id === s.id);
    const present = a.filter((r) => r.status !== "absent").length;
    const sAsg = asgRows.filter((x) => x.subject_id === s.id);
    const done = sAsg.filter((x) => subRows.some((r) => r.assignment_id === x.id)).length;
    return {
      id: s.id, code: s.code, title: s.title, faculty: f?.full_name ?? "To be assigned", facultyEmail: f?.email ?? "",
      credits: s.credits, semester: s.semester, room: "", color: colorFor(s.code),
      progress: sAsg.length ? Math.round((done / sAsg.length) * 100) : 0,
      attendance: a.length ? Math.round((present / a.length) * 100) : 0,
      resources: (rows(mats as any) as any[]).filter((m) => m.subject_id === s.id).map((m) => ({ id: m.id, name: m.title, type: m.kind, size: "" })),
      announcements: [],
    };
  });
  const code = (sid: string) => courses.find((c) => c.id === sid)?.code ?? "";
  const assignments: Assignment[] = asgRows.map((a) => {
    const s = subRows.find((r) => r.assignment_id === a.id);
    return {
      id: a.id, title: a.title, courseId: a.subject_id, courseCode: code(a.subject_id), due: new Date(a.due_at).getTime(),
      points: a.max_points, brief: a.description ?? "",
      status: s ? (s.marks != null ? "graded" : "submitted") : "pending", grade: s?.marks ?? undefined,
    };
  });
  const submissions: LiveSnapshot["submissions"] = {};
  for (const s of subRows) submissions[s.assignment_id] = { fileName: s.file_name ?? "submission", size: 0, at: new Date(s.submitted_at).getTime() };
  const attendance: AttendanceRecord[] = courses.map((c) => {
    const a = attRows.filter((r) => r.subject_id === c.id);
    const byMonth = new Map<string, { p: number; t: number }>();
    for (const r of a) {
      const k = new Date(r.session_date).toLocaleString("en", { month: "short" });
      const v = byMonth.get(k) ?? { p: 0, t: 0 }; v.t++; if (r.status !== "absent") v.p++; byMonth.set(k, v);
    }
    return {
      courseId: c.id, courseCode: c.code, title: c.title, attended: a.filter((r) => r.status !== "absent").length, total: a.length,
      monthly: [...byMonth].map(([month, v]) => ({ month, percent: Math.round((v.p / v.t) * 100) })),
    };
  });

  // ---------- calendar ----------
  const regIds = rows(myRegs as any).map((r: any) => r.event_id);
  const calendar: CalendarItem[] = [
    ...(rows(exams as any) as any[]).filter((e) => subjectIds.includes(e.subject_id)).map((e) => ({
      id: e.id, title: e.title, date: e.exam_date, time: minToTime(e.start_min), type: "exam" as const, note: e.room ?? undefined,
    })),
    ...campusEvents.filter((e) => regIds.includes(e.id)).map((e) => ({ id: `ev-${e.id}`, title: e.title, date: e.date, time: e.time, type: "event" as const, note: e.venue })),
  ];
  const reminderItems: CalendarItem[] = (rows(reminders as any) as any[]).map((r) => ({
    id: r.id, title: r.title, date: ymd(r.due_at), time: hm(r.due_at), type: "reminder", note: r.notes ?? undefined,
  }));

  // ---------- library / jobs / research / achievements ----------
  const bookRows = rows(books as any) as any[];
  const loanRows = rows(loans as any) as any[];
  const appRows = rows(apps as any) as any[];
  const pf = (prefs as any).data;

  return {
    profileId: pid,
    profile: {
      name: me.full_name, email: me.email ?? u.user.email ?? "", department: (dept as any).data?.name ?? "",
      semester: (sp as any).data?.semester ?? 0, bio: me.bio ?? "", photo: me.photo_url || AV(me.full_name),
      skills: me.skills ?? [], interests: me.interests ?? [],
      links: { github: "", linkedin: "", website: "", ...((me.links as any) ?? {}) },
      cgpa: 0, rollNo: me.roll_no ?? (sp as any).data?.roll_no ?? "",
    },
    posts: feed,
    likedPosts: rows(likes as any).map((l: any) => l.post_id),
    bookmarkedPosts: rows(marks as any).map((l: any) => l.post_id),
    notifications: (rows(notes as any) as any[]).map((n) => ({ id: n.id, title: n.title, body: n.body ?? "", kind: n.kind, at: new Date(n.created_at).getTime(), read: n.read })),
    conversations,
    clubs, joinedClubs: rows(myComms as any).map((c: any) => c.community_id),
    events: campusEvents, registeredEvents: regIds,
    courses, assignments, attendance, submissions, calendar, reminders: reminderItems,
    books: bookRows.map((b) => ({ id: b.id, title: b.title, author: b.author, category: b.category, isbn: b.isbn ?? "", copies: b.available_copies, rating: 0, year: 0 })),
    reservedBooks: loanRows.filter((l) => !l.returned_at && l.status !== "cancelled").map((l) => ({ id: l.book_id, loanId: l.id, at: new Date(l.reserved_at).getTime(), due: new Date(l.due_at).getTime() })),
    borrowHistory: loanRows.filter((l) => l.returned_at).map((l) => ({
      id: l.book_id, title: bookRows.find((b) => b.id === l.book_id)?.title ?? "Book",
      borrowed: new Date(l.reserved_at).toLocaleDateString(), returned: new Date(l.returned_at).toLocaleDateString(),
    })),
    jobs: (rows(jobs as any) as any[]).map((j) => ({
      id: j.id, company: j.company, role: j.role_title, type: j.kind === "internship" ? "Internship" : "Full-time",
      location: j.location ?? "", ctc: j.package_lpa ? `${j.package_lpa} LPA` : j.stipend ?? "", deadline: j.apply_by ?? "",
      skills: j.skills ?? [], about: j.description ?? "",
    })),
    appliedJobs: appRows.filter((a) => a.status !== "saved" && a.status !== "withdrawn").map((a) => ({ id: a.job_id, at: new Date(a.created_at).getTime() })),
    savedJobs: appRows.filter((a) => a.saved).map((a) => a.job_id),
    papers: (rows(papers as any) as any[]).map((p) => ({
      id: p.id, title: p.title, authors: (p.authors ?? []).join(", "), venue: p.venue ?? "", year: p.year ?? 0,
      area: p.tags?.[0] ?? "General", abstract: p.abstract ?? "", kind: p.tags?.includes("project") ? "project" : "paper",
    })),
    bookmarkedPapers: rows(pbm as any).map((b: any) => b.paper_id),
    achievements: (rows(ach as any) as any[]).map((a) => ({
      id: a.id, title: a.title, issuer: a.issuer ?? "", date: a.awarded_on ?? "",
      kind: (["certificate", "badge", "competition"].includes(a.category) ? a.category : "certificate") as Achievement["kind"],
      detail: a.description ?? "",
    })),
    settings: pf ? { theme: pf.theme === "dark" ? "dark" : "light", language: pf.language, timezone: pf.timezone, reduceMotion: pf.reduce_motion, largeText: pf.large_text, notif: pf.notifications } : undefined,
  };
}

// ---------------- writes ----------------
type Q = PromiseLike<{ error: any }>;
async function run(build: (pid: string) => Q | undefined) {
  const pid = await myProfileId();
  if (!pid) return;
  const r = await build(pid);
  if (r?.error) console.warn("[campus] write failed:", r.error.message);
  void refreshCampus();
}

export const remote = {
  addPost: (p: { body: string; category: string; kind: string; image?: string; pollOptions?: string[]; eventMeta?: any }) =>
    run((pid) => supabase.from("posts").insert({
      author_profile_id: pid, body: p.body, kind: (p.kind as any) ?? "text", image_url: p.image ?? null,
      event_meta: { category: p.category, ...(p.eventMeta ?? {}) },
      poll: p.pollOptions?.length ? { options: p.pollOptions.map((l, i) => ({ id: String(i), label: l, votes: 0 })) } : null,
    })),
  editPost: (id: string, body: string) => run(() => supabase.from("posts").update({ body }).eq("id", id)),
  deletePost: (id: string) => run(() => supabase.from("posts").delete().eq("id", id)),
  like: (id: string, on: boolean) => run((pid) => on
    ? supabase.from("post_likes").insert({ post_id: id, profile_id: pid })
    : supabase.from("post_likes").delete().eq("post_id", id).eq("profile_id", pid)),
  bookmark: (id: string, on: boolean) => run((pid) => on
    ? supabase.from("bookmarks").insert({ post_id: id, profile_id: pid })
    : supabase.from("bookmarks").delete().eq("post_id", id).eq("profile_id", pid)),
  report: (id: string) => run((pid) => supabase.from("reports").insert({ reporter_profile_id: pid, target: "post", target_id: id, reason: "Reported from feed" })),
  comment: (postId: string, body: string, parentId?: string) =>
    run((pid) => supabase.from("comments").insert({ post_id: postId, author_profile_id: pid, body, parent_id: parentId ?? null })),
  markRead: (id: string, read: boolean) => run(() => supabase.from("notifications").update({ read }).eq("id", id)),
  markAllRead: () => run((pid) => supabase.from("notifications").update({ read: true }).eq("profile_id", pid)),
  deleteNotification: (id: string) => run(() => supabase.from("notifications").delete().eq("id", id)),
  clearNotifications: () => run((pid) => supabase.from("notifications").delete().eq("profile_id", pid)),
  sendMessage: (cid: string, body: string, attachment?: { name: string }) =>
    run((pid) => supabase.from("messages").insert({ conversation_id: cid, sender_profile_id: pid, body, attachment_name: attachment?.name ?? null })),
  markConversationRead: (cid: string) =>
    run((pid) => supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", cid).eq("profile_id", pid)),
  club: (id: string, on: boolean) => run((pid) => on
    ? supabase.from("community_members").insert({ community_id: id, profile_id: pid })
    : supabase.from("community_members").delete().eq("community_id", id).eq("profile_id", pid)),
  event: (id: string, on: boolean) => run((pid) => on
    ? supabase.from("event_registrations").insert({ event_id: id, profile_id: pid })
    : supabase.from("event_registrations").delete().eq("event_id", id).eq("profile_id", pid)),
  reserveBook: (id: string) => run((pid) => supabase.from("book_loans").insert({ book_id: id, profile_id: pid, due_at: new Date(Date.now() + 14 * 86400000).toISOString() })),
  renewBook: (loanId: string, due: number) => run(() => supabase.from("book_loans").update({ due_at: new Date(due + 14 * 86400000).toISOString() }).eq("id", loanId)),
  cancelBook: (loanId: string) => run(() => supabase.from("book_loans").delete().eq("id", loanId)),
  saveJob: (id: string, saved: boolean) => run((pid) => supabase.from("job_applications").upsert(
    { job_id: id, profile_id: pid, saved, status: "saved" }, { onConflict: "job_id,profile_id", ignoreDuplicates: false })),
  applyJob: (id: string) => run((pid) => supabase.from("job_applications").upsert({ job_id: id, profile_id: pid, status: "applied" }, { onConflict: "job_id,profile_id" })),
  withdrawJob: (id: string) => run((pid) => supabase.from("job_applications").update({ status: "withdrawn" }).eq("job_id", id).eq("profile_id", pid)),
  paper: (id: string, on: boolean) => run((pid) => on
    ? supabase.from("paper_bookmarks").insert({ paper_id: id, profile_id: pid })
    : supabase.from("paper_bookmarks").delete().eq("paper_id", id).eq("profile_id", pid)),
  addReminder: (r: { title: string; date: string; time: string; note?: string }) =>
    run((pid) => supabase.from("reminders").insert({ profile_id: pid, title: r.title, notes: r.note ?? null, due_at: new Date(`${r.date}T${r.time || "09:00"}`).toISOString() })),
  editReminder: (id: string, r: Partial<CalendarItem>) => run(() => supabase.from("reminders").update({
    ...(r.title ? { title: r.title } : {}), ...(r.note !== undefined ? { notes: r.note } : {}),
    ...(r.date ? { due_at: new Date(`${r.date}T${r.time || "09:00"}`).toISOString() } : {}),
  }).eq("id", id)),
  deleteReminder: (id: string) => run(() => supabase.from("reminders").delete().eq("id", id)),
  submit: (id: string, fileName: string) => run((pid) => supabase.from("submissions").insert({ assignment_id: id, student_profile_id: pid, file_name: fileName })),
  unsubmit: (id: string) => run((pid) => supabase.from("submissions").delete().eq("assignment_id", id).eq("student_profile_id", pid)),
  saveProfile: (p: any) => run((pid) => supabase.from("profiles").update({
    ...(p.name !== undefined ? { full_name: p.name } : {}), ...(p.bio !== undefined ? { bio: p.bio } : {}),
    ...(p.photo !== undefined ? { photo_url: p.photo } : {}), ...(p.skills ? { skills: p.skills } : {}),
    ...(p.interests ? { interests: p.interests } : {}), ...(p.links ? { links: p.links } : {}),
  }).eq("id", pid)),
  savePrefs: (s: any) => run((pid) => supabase.from("user_preferences").upsert({
    profile_id: pid, theme: s.theme, language: s.language, timezone: s.timezone,
    reduce_motion: s.reduceMotion, large_text: s.largeText, notifications: s.notif,
  }, { onConflict: "profile_id" })),
};

// ---------------- sync ----------------
let applying: ((s: LiveSnapshot) => void) | null = null;
let inflight: Promise<void> | null = null;
export function registerApply(fn: (s: LiveSnapshot) => void) { applying = fn; }
export function refreshCampus() {
  if (inflight) return inflight;
  inflight = loadCampus()
    .then((s) => { if (s && applying) applying(s); })
    .catch((e) => console.warn("[campus] load failed", e))
    .finally(() => { inflight = null; });
  return inflight;
}

/** Mount once inside the dashboard layout. Loads real data and refreshes on focus. */
export function useCampusSync() {
  useEffect(() => {
    void refreshCampus();
    const onFocus = () => void refreshCampus();
    window.addEventListener("focus", onFocus);
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") void refreshCampus(); });
    return () => { window.removeEventListener("focus", onFocus); data.subscription.unsubscribe(); };
  }, []);
}

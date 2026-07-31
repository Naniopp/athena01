import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  seedPosts, seedConversations, type Post, type Comment, type Conversation,
  type CalendarItem, seedCalendar, type PostCategory, type PostKind, avatarFor,
} from "./seed";

export interface Profile {
  name: string;
  email: string;
  department: string;
  semester: number;
  bio: string;
  photo: string;
  skills: string[];
  interests: string[];
  links: { github: string; linkedin: string; website: string };
  cgpa: number;
  rollNo: string;
}

export interface Settings {
  theme: "light" | "dark";
  language: string;
  timezone: string;
  reduceMotion: boolean;
  largeText: boolean;
  notif: {
    enabled: boolean; email: boolean; push: boolean;
    events: boolean; assignments: boolean; messages: boolean;
  };
  privacy: {
    profileVisibility: "public" | "campus" | "private";
    showAchievements: boolean;
    showEmail: boolean;
  };
  blocked: string[];
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: "assignment" | "attendance" | "exam" | "club" | "placement" | "message" | "system";
  at: number;
  read: boolean;
}

export interface Submission {
  fileName: string;
  size: number;
  at: number;
  dataUrl?: string;
}

export interface AiMessage { id: string; role: "user" | "ai"; body: string; at: number }
export interface AiChat { id: string; title: string; pinned: boolean; at: number; messages: AiMessage[] }

export interface Session {
  id: string; device: string; location: string; at: number; current?: boolean;
}

interface State {
  hydrated: boolean;
  profile: Profile;
  settings: Settings;
  posts: Post[];
  likedPosts: string[];
  bookmarkedPosts: string[];
  notifications: Notification[];
  conversations: Conversation[];
  joinedClubs: string[];
  registeredEvents: string[];
  bookmarkedEvents: string[];
  reservedBooks: { id: string; at: number; due: number }[];
  borrowHistory: { id: string; title: string; borrowed: string; returned: string }[];
  appliedJobs: { id: string; at: number }[];
  savedJobs: string[];
  bookmarkedPapers: string[];
  bookmarkedCourses: string[];
  reminders: CalendarItem[];
  submissions: Record<string, Submission>;
  aiChats: AiChat[];
  sessions: Session[];
  logins: { at: number; device: string; ip: string }[];
}

interface Actions {
  setProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<Settings>) => void;
  toggleTheme: () => void;
  addPost: (p: { body: string; category: PostCategory; kind: PostKind; image?: string; pollOptions?: string[]; eventMeta?: Post["eventMeta"] }) => void;
  editPost: (id: string, body: string) => void;
  deletePost: (id: string) => void;
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  sharePost: (id: string) => void;
  reportPost: (id: string) => void;
  addComment: (postId: string, body: string, parentId?: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  pushNotification: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markRead: (id: string, read: boolean) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  sendMessage: (cid: string, body: string, attachment?: Message0) => void;
  markConversationRead: (cid: string) => void;
  toggleClub: (id: string) => void;
  toggleEvent: (id: string) => void;
  toggleEventBookmark: (id: string) => void;
  reserveBook: (id: string) => void;
  renewBook: (id: string) => void;
  cancelBook: (id: string) => void;
  toggleJob: (id: string) => void;
  applyJob: (id: string) => void;
  withdrawJob: (id: string) => void;
  togglePaper: (id: string) => void;
  toggleCourseBookmark: (id: string) => void;
  addReminder: (r: Omit<CalendarItem, "id" | "type">) => void;
  editReminder: (id: string, r: Partial<CalendarItem>) => void;
  deleteReminder: (id: string) => void;
  submitAssignment: (id: string, s: Submission) => void;
  deleteSubmission: (id: string) => void;
  newChat: () => string;
  sendAi: (chatId: string, body: string) => void;
  renameChat: (chatId: string, title: string) => void;
  pinChat: (chatId: string) => void;
  clearChats: () => void;
  revokeSession: (id: string) => void;
  revokeAllSessions: () => void;
  resetAll: () => void;
}

type Message0 = { name: string; kind: "file" | "image" };

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultProfile: Profile = {
  name: "Alex Johnson",
  email: "alex.johnson@athena.edu",
  department: "Computer Science & Engineering",
  semester: 5,
  bio: "Fifth-semester CSE student building applied ML systems. Robotics Club core member.",
  photo: avatarFor("Alex"),
  skills: ["TypeScript", "Python", "PyTorch", "SQL", "Figma"],
  interests: ["Applied ML", "Systems Design", "Product Design"],
  links: { github: "github.com/alexj", linkedin: "linkedin.com/in/alexj", website: "" },
  cgpa: 8.7,
  rollNo: "CSE23B142",
};

const defaultSettings: Settings = {
  theme: "light",
  language: "English",
  timezone: "Asia/Kolkata (GMT+5:30)",
  reduceMotion: false,
  largeText: false,
  notif: { enabled: true, email: true, push: true, events: true, assignments: true, messages: true },
  privacy: { profileVisibility: "campus", showAchievements: true, showEmail: false },
  blocked: [],
};

const now = Date.now();

const defaultNotifications: Notification[] = [
  { id: "n1", title: "Assignment uploaded", body: "Query Optimisation Report · due in 2 days", kind: "assignment", at: now - 3600_000, read: false },
  { id: "n2", title: "Attendance updated", body: "Software Engineering is at 71% — below the 75% threshold", kind: "attendance", at: now - 5 * 3600_000, read: false },
  { id: "n3", title: "Exam schedule released", body: "Mid-semester timetable is now available", kind: "exam", at: now - 9 * 3600_000, read: false },
  { id: "n4", title: "Club invitation", body: "AI Society invited you to the agent workshop", kind: "club", at: now - 26 * 3600_000, read: true },
  { id: "n5", title: "Placement drive", body: "Northwind Analytics closes applications Friday", kind: "placement", at: now - 30 * 3600_000, read: true },
];

const initial: State = {
  hydrated: false,
  profile: defaultProfile,
  settings: defaultSettings,
  posts: seedPosts,
  likedPosts: [],
  bookmarkedPosts: [],
  notifications: defaultNotifications,
  conversations: seedConversations,
  joinedClubs: ["cl1"],
  registeredEvents: ["ev6"],
  bookmarkedEvents: [],
  reservedBooks: [],
  borrowHistory: [
    { id: "b3", title: "The Design of Everyday Things", borrowed: "12 Aug 2025", returned: "02 Sep 2025" },
    { id: "b8", title: "Introduction to Algorithms", borrowed: "18 Sep 2025", returned: "10 Oct 2025" },
  ],
  appliedJobs: [{ id: "j1", at: now - 2 * 86400000 }],
  savedJobs: ["j3"],
  bookmarkedPapers: [],
  bookmarkedCourses: [],
  reminders: seedCalendar.filter((c) => c.type === "reminder"),
  submissions: {},
  aiChats: [],
  sessions: [
    { id: "s1", device: "MacBook Pro · Chrome", location: "Campus Wi-Fi", at: now, current: true },
    { id: "s2", device: "iPhone 15 · Safari", location: "Hostel Block C", at: now - 2 * 86400000 },
  ],
  logins: [
    { at: now - 3600_000, device: "MacBook Pro · Chrome", ip: "10.21.4.88" },
    { at: now - 2 * 86400000, device: "iPhone 15 · Safari", ip: "10.21.9.12" },
    { at: now - 6 * 86400000, device: "Lab PC · Edge", ip: "10.21.1.5" },
  ],
};

function addReply(list: Comment[], parentId: string, reply: Comment): Comment[] {
  return list.map((c) =>
    c.id === parentId ? { ...c, replies: [...c.replies, reply] } : { ...c, replies: addReply(c.replies, parentId, reply) },
  );
}

const AI_REPLIES = [
  "Here's what I found across your campus data:",
  "Based on your schedule and deadlines, here's my suggestion:",
  "I checked your courses and attendance records:",
];

function aiAnswer(q: string): string {
  const t = q.toLowerCase();
  if (t.includes("attend")) return "Your overall attendance is 84%. Software Engineering (CSE503) is the risk at 71% — attend the next 4 sessions to cross 75%.";
  if (t.includes("assignment") || t.includes("due")) return "You have 3 pending assignments. The nearest is the Query Optimisation Report (CSE502, 40 points) due in 2 days. Want me to add a reminder to your calendar?";
  if (t.includes("placement") || t.includes("job")) return "Northwind Analytics (SDE Intern) closes Friday and matches your TypeScript + SQL profile. You've already applied. Two more roles fit: Lumen Fintech and Halcyon Labs.";
  if (t.includes("exam")) return "Mid-semester exams start in 4 days. Machine Learning is first (Hall B, 9:00 AM), followed by Databases three days later.";
  if (t.includes("class") || t.includes("today")) return "Today: Machine Learning at 9:00 (Hall B), Database Systems at 11:00 (Lab 3), Software Engineering Lab at 14:00.";
  if (t.includes("club") || t.includes("event")) return "RoboSprint 4.0 is on Saturday at the Innovation Lab, and the Agentic AI Workshop has 22 seats left.";
  return `${AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)]} I can help with courses, assignments, attendance, placements, events, and library reservations — ask me anything about your campus.`;
}

export const useCampus = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setSettings: (v) => set((s) => ({ settings: { ...s.settings, ...v } })),
      toggleTheme: () => set((s) => ({ settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" } })),

      addPost: ({ body, category, kind, image, pollOptions, eventMeta }) =>
        set((s) => ({
          posts: [
            {
              id: uid(),
              author: s.profile.name,
              authorRole: `Student · ${s.profile.department.split(" ")[0]}`,
              avatar: s.profile.photo,
              category, kind, body, image, eventMeta,
              poll: pollOptions?.length ? { options: pollOptions.map((l) => ({ id: uid(), label: l, votes: 0 })) } : undefined,
              createdAt: Date.now(),
              likes: 0, shares: 0, comments: [], own: true,
            },
            ...s.posts,
          ],
        })),
      editPost: (id, body) => set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, body } : p)) })),
      deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),
      toggleLike: (id) =>
        set((s) => {
          const liked = s.likedPosts.includes(id);
          return {
            likedPosts: liked ? s.likedPosts.filter((x) => x !== id) : [...s.likedPosts, id],
            posts: s.posts.map((p) => (p.id === id ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p)),
          };
        }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarkedPosts: s.bookmarkedPosts.includes(id) ? s.bookmarkedPosts.filter((x) => x !== id) : [...s.bookmarkedPosts, id],
        })),
      sharePost: (id) => set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, shares: p.shares + 1 } : p)) })),
      reportPost: (id) => set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, reported: true } : p)) })),
      addComment: (postId, body, parentId) =>
        set((s) => {
          const c: Comment = { id: uid(), author: s.profile.name, avatar: s.profile.photo, body, createdAt: Date.now(), replies: [] };
          return {
            posts: s.posts.map((p) =>
              p.id !== postId ? p : { ...p, comments: parentId ? addReply(p.comments, parentId, c) : [...p.comments, c] },
            ),
          };
        }),
      votePoll: (postId, optionId) =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId || !p.poll || p.poll.votedId) return p;
            return {
              ...p,
              poll: {
                votedId: optionId,
                options: p.poll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
              },
            };
          }),
        })),

      pushNotification: (n) =>
        set((s) => ({ notifications: [{ ...n, id: uid(), at: Date.now(), read: false }, ...s.notifications] })),
      markRead: (id, read) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      deleteNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      clearNotifications: () => set({ notifications: [] }),

      sendMessage: (cid, body, attachment) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === cid ? { ...c, messages: [...c.messages, { id: uid(), from: "me", body, at: Date.now(), attachment }] } : c,
          ),
        }));
        const replyDelay = 1400 + Math.random() * 1200;
        setTimeout(() => {
          const conv = get().conversations.find((c) => c.id === cid);
          if (!conv) return;
          const reply = conv.kind === "group"
            ? "Noted — I'll share it with the group."
            : "Got it, thanks for the update!";
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === cid ? { ...c, messages: [...c.messages, { id: uid(), from: "them", body: reply, at: Date.now() }] } : c,
            ),
          }));
        }, replyDelay);
      },
      markConversationRead: (cid) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === cid ? { ...c, unread: 0 } : c)) })),

      toggleClub: (id) =>
        set((s) => ({ joinedClubs: s.joinedClubs.includes(id) ? s.joinedClubs.filter((x) => x !== id) : [...s.joinedClubs, id] })),
      toggleEvent: (id) =>
        set((s) => ({ registeredEvents: s.registeredEvents.includes(id) ? s.registeredEvents.filter((x) => x !== id) : [...s.registeredEvents, id] })),
      toggleEventBookmark: (id) =>
        set((s) => ({ bookmarkedEvents: s.bookmarkedEvents.includes(id) ? s.bookmarkedEvents.filter((x) => x !== id) : [...s.bookmarkedEvents, id] })),

      reserveBook: (id) =>
        set((s) => ({ reservedBooks: [...s.reservedBooks, { id, at: Date.now(), due: Date.now() + 14 * 86400000 }] })),
      renewBook: (id) =>
        set((s) => ({ reservedBooks: s.reservedBooks.map((b) => (b.id === id ? { ...b, due: b.due + 14 * 86400000 } : b)) })),
      cancelBook: (id) => set((s) => ({ reservedBooks: s.reservedBooks.filter((b) => b.id !== id) })),

      toggleJob: (id) =>
        set((s) => ({ savedJobs: s.savedJobs.includes(id) ? s.savedJobs.filter((x) => x !== id) : [...s.savedJobs, id] })),
      applyJob: (id) => set((s) => (s.appliedJobs.some((a) => a.id === id) ? s : { appliedJobs: [...s.appliedJobs, { id, at: Date.now() }] })),
      withdrawJob: (id) => set((s) => ({ appliedJobs: s.appliedJobs.filter((a) => a.id !== id) })),

      togglePaper: (id) =>
        set((s) => ({ bookmarkedPapers: s.bookmarkedPapers.includes(id) ? s.bookmarkedPapers.filter((x) => x !== id) : [...s.bookmarkedPapers, id] })),
      toggleCourseBookmark: (id) =>
        set((s) => ({ bookmarkedCourses: s.bookmarkedCourses.includes(id) ? s.bookmarkedCourses.filter((x) => x !== id) : [...s.bookmarkedCourses, id] })),

      addReminder: (r) => set((s) => ({ reminders: [...s.reminders, { ...r, id: uid(), type: "reminder" }] })),
      editReminder: (id, r) => set((s) => ({ reminders: s.reminders.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
      deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((x) => x.id !== id) })),

      submitAssignment: (id, sub) => set((s) => ({ submissions: { ...s.submissions, [id]: sub } })),
      deleteSubmission: (id) =>
        set((s) => {
          const next = { ...s.submissions };
          delete next[id];
          return { submissions: next };
        }),

      newChat: () => {
        const id = uid();
        set((s) => ({ aiChats: [{ id, title: "New conversation", pinned: false, at: Date.now(), messages: [] }, ...s.aiChats] }));
        return id;
      },
      sendAi: (chatId, body) => {
        set((s) => ({
          aiChats: s.aiChats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? body.slice(0, 40) : c.title,
                  at: Date.now(),
                  messages: [...c.messages, { id: uid(), role: "user", body, at: Date.now() }],
                }
              : c,
          ),
        }));
        setTimeout(() => {
          set((s) => ({
            aiChats: s.aiChats.map((c) =>
              c.id === chatId ? { ...c, messages: [...c.messages, { id: uid(), role: "ai", body: aiAnswer(body), at: Date.now() }] } : c,
            ),
          }));
        }, 900);
      },
      renameChat: (chatId, title) => set((s) => ({ aiChats: s.aiChats.map((c) => (c.id === chatId ? { ...c, title } : c)) })),
      pinChat: (chatId) => set((s) => ({ aiChats: s.aiChats.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c)) })),
      clearChats: () => set({ aiChats: [] }),

      revokeSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      revokeAllSessions: () => set((s) => ({ sessions: s.sessions.filter((x) => x.current) })),

      resetAll: () => set({ ...initial, hydrated: true }),
    }),
    {
      name: "athena-campus-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest as State,
      onRehydrateStorage: () => (state) => {
        state?.markHydrated?.();
      },
    },
  ),
);

// zustand persist can't set a non-persisted flag directly; expose a helper.
declare module "zustand" {}
(useCampus as unknown as { getState: () => Record<string, unknown> }).getState();

export function useHydrated() {
  return useCampus.persist.hasHydrated();
}

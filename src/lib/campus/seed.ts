// Realistic mock data for the ATHENA campus OS.
// Shaped like REST payloads so a backend can replace these arrays later.

export type Role = "student" | "faculty" | "club" | "admin";

export type PostCategory =
  | "Announcements"
  | "Academics"
  | "Assignments"
  | "Clubs"
  | "Placements"
  | "Research"
  | "Events";

export type PostKind = "text" | "image" | "poll" | "announcement" | "event";

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  body: string;
  createdAt: number;
  replies: Comment[];
}

export interface Post {
  id: string;
  author: string;
  authorRole: string;
  avatar: string;
  category: PostCategory;
  kind: PostKind;
  body: string;
  image?: string;
  poll?: { options: { id: string; label: string; votes: number }[]; votedId?: string };
  eventMeta?: { title: string; date: string; venue: string };
  createdAt: number;
  likes: number;
  shares: number;
  comments: Comment[];
  own?: boolean;
  reported?: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  facultyEmail: string;
  credits: number;
  semester: number;
  room: string;
  progress: number;
  attendance: number;
  color: string;
  resources: { id: string; name: string; type: string; size: string }[];
  announcements: { id: string; title: string; body: string; date: string }[];
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  due: number;
  points: number;
  status: "pending" | "submitted" | "graded";
  grade?: number;
  brief: string;
}

export interface AttendanceRecord {
  courseId: string;
  courseCode: string;
  title: string;
  attended: number;
  total: number;
  monthly: { month: string; percent: number }[];
}

export interface CalendarItem {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  time: string;
  type: "class" | "exam" | "event" | "reminder";
  note?: string;
}

export interface Message {
  id: string;
  from: "me" | "them";
  body: string;
  at: number;
  attachment?: { name: string; kind: "file" | "image" };
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  kind: "dm" | "group";
  members?: number;
  messages: Message[];
  unread: number;
}

export interface Club {
  id: string;
  name: string;
  tagline: string;
  category: string;
  members: number;
  cover: string;
  about: string;
  gallery: string[];
  events: { id: string; title: string; date: string }[];
  announcements: { id: string; body: string; date: string }[];
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  seats: number;
  registered: number;
  about: string;
  cover: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  copies: number;
  rating: number;
  year: number;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  type: "Internship" | "Full-time";
  location: string;
  ctc: string;
  deadline: string;
  skills: string[];
  about: string;
  interview?: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  area: string;
  abstract: string;
  kind: "paper" | "project";
}

export interface Achievement {
  id: string;
  title: string;
  issuer: string;
  date: string;
  kind: "certificate" | "badge" | "competition";
  detail: string;
}

const day = 86_400_000;
const now = Date.now();

const AV = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=ffedd5`;

export const seedPosts: Post[] = [
  {
    id: "p1",
    author: "Dr. Meera Krishnan",
    authorRole: "Faculty · CSE",
    avatar: AV("Meera"),
    category: "Announcements",
    kind: "announcement",
    body: "Mid-semester exam schedule is out. Machine Learning moves to Nov 18, 9:00 AM in Hall B. Please carry your hall tickets and student ID.",
    createdAt: now - 2 * 3600_000,
    likes: 214,
    shares: 31,
    comments: [
      {
        id: "c1",
        author: "Rahul Nair",
        avatar: AV("Rahul"),
        body: "Will the syllabus include unit 5?",
        createdAt: now - 3400_000,
        replies: [
          { id: "c1r1", author: "Dr. Meera Krishnan", avatar: AV("Meera"), body: "Units 1–4 only.", createdAt: now - 3000_000, replies: [] },
        ],
      },
    ],
  },
  {
    id: "p2",
    author: "Prof. Anand Iyer",
    authorRole: "Faculty · Databases",
    avatar: AV("Anand"),
    category: "Assignments",
    kind: "text",
    body: "New assignment uploaded: Query Optimisation Report. Due next Friday, 40 points. Submit through the Assignments tab.",
    createdAt: now - 6 * 3600_000,
    likes: 96,
    shares: 12,
    comments: [],
  },
  {
    id: "p3",
    author: "Robotics Club",
    authorRole: "Club",
    avatar: AV("Robotics"),
    category: "Clubs",
    kind: "event",
    body: "Line-follower showdown this Saturday. 24 teams, one arena, and a very confused robot named Kevin.",
    eventMeta: { title: "RoboSprint 4.0", date: "Sat, 10:00 AM", venue: "Innovation Lab" },
    createdAt: now - 10 * 3600_000,
    likes: 341,
    shares: 58,
    comments: [],
  },
  {
    id: "p4",
    author: "Placement Cell",
    authorRole: "Administration",
    avatar: AV("Placement"),
    category: "Placements",
    kind: "announcement",
    body: "Northwind Analytics is hiring SDE Interns — 12 LPA equivalent stipend track. Applications close Friday. Eligibility: CGPA 7.5+.",
    createdAt: now - day,
    likes: 512,
    shares: 143,
    comments: [],
  },
  {
    id: "p5",
    author: "Aisha Verma",
    authorRole: "Student · CSE '27",
    avatar: AV("Aisha"),
    category: "Research",
    kind: "text",
    body: "Our paper on federated learning for campus IoT got accepted at NCICT 2026. Huge thanks to Dr. Krishnan for the guidance.",
    createdAt: now - day - 4 * 3600_000,
    likes: 728,
    shares: 66,
    comments: [],
  },
  {
    id: "p6",
    author: "Central Library",
    authorRole: "Administration",
    avatar: AV("Library"),
    category: "Announcements",
    kind: "text",
    body: "Extended hours during exam weeks: the reading hall stays open until 1:00 AM from Nov 15.",
    createdAt: now - 2 * day,
    likes: 189,
    shares: 22,
    comments: [],
  },
  {
    id: "p7",
    author: "Karthik Reddy",
    authorRole: "Student · ECE '26",
    avatar: AV("Karthik"),
    category: "Events",
    kind: "poll",
    body: "Which track should we run at the winter hackathon?",
    poll: {
      options: [
        { id: "o1", label: "Agentic AI", votes: 148 },
        { id: "o2", label: "Campus Sustainability", votes: 87 },
        { id: "o3", label: "AR/VR Learning", votes: 63 },
      ],
    },
    createdAt: now - 2 * day - 3600_000,
    likes: 132,
    shares: 9,
    comments: [],
  },
  {
    id: "p8",
    author: "Sports Council",
    authorRole: "Club",
    avatar: AV("Sports"),
    category: "Events",
    kind: "text",
    body: "Inter-department football final: CSE 3 – 2 MECH. What a comeback in the last eleven minutes.",
    createdAt: now - 3 * day,
    likes: 405,
    shares: 40,
    comments: [],
  },
  {
    id: "p9",
    author: "Dean of Academics",
    authorRole: "Administration",
    avatar: AV("Dean"),
    category: "Academics",
    kind: "announcement",
    body: "Course registration for Semester 6 opens Monday 9:00 AM. Electives fill fast — keep a backup choice ready.",
    createdAt: now - 4 * day,
    likes: 267,
    shares: 71,
    comments: [],
  },
  {
    id: "p10",
    author: "Design Guild",
    authorRole: "Club",
    avatar: AV("Design"),
    category: "Clubs",
    kind: "text",
    body: "Portfolio review night — bring one project, leave with ten opinions. Thursday, 6 PM, Studio 2.",
    createdAt: now - 5 * day,
    likes: 154,
    shares: 18,
    comments: [],
  },
];

export const seedCourses: Course[] = [
  {
    id: "cse501", code: "CSE501", title: "Machine Learning", faculty: "Dr. Meera Krishnan", facultyEmail: "meera.k@athena.edu",
    credits: 4, semester: 5, room: "Hall B", progress: 68, attendance: 82, color: "#F97316",
    resources: [
      { id: "r1", name: "Week 7 — Ensemble Methods.pdf", type: "PDF", size: "2.4 MB" },
      { id: "r2", name: "Lab 4 Starter Notebook.ipynb", type: "Notebook", size: "310 KB" },
    ],
    announcements: [{ id: "a1", title: "Quiz 3 postponed", body: "Quiz 3 moves to Friday.", date: "2 days ago" }],
  },
  {
    id: "cse502", code: "CSE502", title: "Database Systems", faculty: "Prof. Anand Iyer", facultyEmail: "anand.i@athena.edu",
    credits: 4, semester: 5, room: "Lab 3", progress: 74, attendance: 91, color: "#111111",
    resources: [{ id: "r3", name: "Normalization Cheatsheet.pdf", type: "PDF", size: "820 KB" }],
    announcements: [{ id: "a2", title: "Assignment 2 live", body: "Query optimisation report is open.", date: "6 hours ago" }],
  },
  {
    id: "cse503", code: "CSE503", title: "Software Engineering", faculty: "Dr. Priya Raman", facultyEmail: "priya.r@athena.edu",
    credits: 3, semester: 5, room: "Hall A", progress: 55, attendance: 71, color: "#6B7280",
    resources: [{ id: "r4", name: "Sprint Planning Template.docx", type: "Doc", size: "44 KB" }],
    announcements: [],
  },
  {
    id: "cse504", code: "CSE504", title: "Computer Networks", faculty: "Prof. Vikram Shah", facultyEmail: "vikram.s@athena.edu",
    credits: 4, semester: 5, room: "Hall C", progress: 61, attendance: 88, color: "#F97316",
    resources: [{ id: "r5", name: "TCP Congestion Notes.pdf", type: "PDF", size: "1.1 MB" }],
    announcements: [],
  },
  {
    id: "cse505", code: "CSE505", title: "Human-Computer Interaction", faculty: "Dr. Sneha Kulkarni", facultyEmail: "sneha.k@athena.edu",
    credits: 3, semester: 5, room: "Studio 2", progress: 80, attendance: 94, color: "#111111",
    resources: [{ id: "r6", name: "Heuristic Evaluation Kit.pdf", type: "PDF", size: "630 KB" }],
    announcements: [],
  },
];

export const seedAssignments: Assignment[] = [
  { id: "as1", title: "Query Optimisation Report", courseId: "cse502", courseCode: "CSE502", due: now + 2 * day, points: 40, status: "pending", brief: "Profile three slow queries and rewrite them with justification." },
  { id: "as2", title: "Ensemble Methods Lab", courseId: "cse501", courseCode: "CSE501", due: now + 5 * day, points: 30, status: "pending", brief: "Implement bagging and boosting on the campus dataset." },
  { id: "as3", title: "Sprint 2 Retrospective", courseId: "cse503", courseCode: "CSE503", due: now + 9 * day, points: 20, status: "pending", brief: "Two-page retro with velocity chart." },
  { id: "as4", title: "Socket Programming Exercise", courseId: "cse504", courseCode: "CSE504", due: now - 3 * day, points: 25, status: "graded", grade: 23, brief: "Build a concurrent echo server." },
  { id: "as5", title: "Usability Audit", courseId: "cse505", courseCode: "CSE505", due: now - 8 * day, points: 25, status: "graded", grade: 25, brief: "Audit the campus portal against Nielsen heuristics." },
  { id: "as6", title: "Regression Notebook", courseId: "cse501", courseCode: "CSE501", due: now - 1 * day, points: 20, status: "submitted", brief: "Linear and ridge regression comparison." },
];

export const seedAttendance: AttendanceRecord[] = [
  { courseId: "cse501", courseCode: "CSE501", title: "Machine Learning", attended: 41, total: 50, monthly: [{ month: "Jul", percent: 88 }, { month: "Aug", percent: 84 }, { month: "Sep", percent: 79 }, { month: "Oct", percent: 82 }] },
  { courseId: "cse502", courseCode: "CSE502", title: "Database Systems", attended: 41, total: 45, monthly: [{ month: "Jul", percent: 95 }, { month: "Aug", percent: 92 }, { month: "Sep", percent: 88 }, { month: "Oct", percent: 91 }] },
  { courseId: "cse503", courseCode: "CSE503", title: "Software Engineering", attended: 27, total: 38, monthly: [{ month: "Jul", percent: 80 }, { month: "Aug", percent: 74 }, { month: "Sep", percent: 66 }, { month: "Oct", percent: 71 }] },
  { courseId: "cse504", courseCode: "CSE504", title: "Computer Networks", attended: 44, total: 50, monthly: [{ month: "Jul", percent: 90 }, { month: "Aug", percent: 86 }, { month: "Sep", percent: 89 }, { month: "Oct", percent: 88 }] },
  { courseId: "cse505", courseCode: "CSE505", title: "Human-Computer Interaction", attended: 34, total: 36, monthly: [{ month: "Jul", percent: 96 }, { month: "Aug", percent: 93 }, { month: "Sep", percent: 92 }, { month: "Oct", percent: 94 }] },
];

const iso = (offset: number) => new Date(now + offset * day).toISOString().slice(0, 10);

export const seedCalendar: CalendarItem[] = [
  { id: "k1", title: "Machine Learning", date: iso(0), time: "09:00", type: "class" },
  { id: "k2", title: "Database Systems", date: iso(0), time: "11:00", type: "class" },
  { id: "k3", title: "Software Engineering Lab", date: iso(0), time: "14:00", type: "class" },
  { id: "k4", title: "Computer Networks", date: iso(1), time: "10:00", type: "class" },
  { id: "k5", title: "Mid-sem: Machine Learning", date: iso(4), time: "09:00", type: "exam" },
  { id: "k6", title: "RoboSprint 4.0", date: iso(2), time: "10:00", type: "event" },
  { id: "k7", title: "AI Workshop", date: iso(6), time: "15:00", type: "event" },
  { id: "k8", title: "Mid-sem: Databases", date: iso(7), time: "09:00", type: "exam" },
];

export const seedConversations: Conversation[] = [
  {
    id: "cv1", name: "Dr. Meera Krishnan", avatar: AV("Meera"), kind: "dm", unread: 2,
    messages: [
      { id: "m1", from: "them", body: "Your regression notebook looks solid. Add a short error analysis section.", at: now - 5 * 3600_000 },
      { id: "m2", from: "me", body: "Thank you! I'll push the update tonight.", at: now - 4.6 * 3600_000 },
      { id: "m3", from: "them", body: "Perfect. Also consider joining the research reading group.", at: now - 3 * 3600_000 },
    ],
  },
  {
    id: "cv2", name: "CSE '27 Batch", avatar: AV("Batch"), kind: "group", members: 128, unread: 5,
    messages: [
      { id: "m4", from: "them", body: "Does anyone have the DBMS lab manual?", at: now - 9 * 3600_000 },
      { id: "m5", from: "me", body: "Uploading it to the shared drive now.", at: now - 8.5 * 3600_000 },
    ],
  },
  {
    id: "cv3", name: "Robotics Club Core", avatar: AV("Robotics"), kind: "group", members: 14, unread: 0,
    messages: [{ id: "m6", from: "them", body: "Arena setup at 7 AM Saturday. Bring the spare batteries.", at: now - day }],
  },
  {
    id: "cv4", name: "Aisha Verma", avatar: AV("Aisha"), kind: "dm", unread: 0,
    messages: [{ id: "m7", from: "them", body: "Coffee after the seminar?", at: now - 2 * day }],
  },
];

export const seedClubs: Club[] = [
  { id: "cl1", name: "Robotics Club", tagline: "We build things that move.", category: "Technology", members: 214, cover: "#F97316", about: "Hardware and autonomy projects, weekly build nights, and inter-college competitions.", gallery: ["#F97316", "#111111", "#6B7280"], events: [{ id: "ce1", title: "RoboSprint 4.0", date: "Saturday" }], announcements: [{ id: "ca1", body: "Recruitment for the drone team is open.", date: "1 day ago" }] },
  { id: "cl2", name: "Design Guild", tagline: "Craft over clutter.", category: "Creative", members: 168, cover: "#111111", about: "Product design, typography clinics, and portfolio reviews.", gallery: ["#111111", "#F97316"], events: [{ id: "ce2", title: "Portfolio Night", date: "Thursday" }], announcements: [] },
  { id: "cl3", name: "AI Society", tagline: "Papers, prototypes, pizza.", category: "Technology", members: 302, cover: "#F97316", about: "Reading groups on modern ML plus applied agent projects.", gallery: ["#F97316"], events: [{ id: "ce3", title: "Agentic AI Workshop", date: "Next week" }], announcements: [] },
  { id: "cl4", name: "Sports Council", tagline: "Every match matters.", category: "Sports", members: 421, cover: "#6B7280", about: "Runs inter-department leagues and the annual sports fest.", gallery: ["#6B7280", "#111111"], events: [{ id: "ce4", title: "Sports Fest", date: "Dec 2" }], announcements: [] },
  { id: "cl5", name: "Debate Union", tagline: "Argue well, listen better.", category: "Literary", members: 97, cover: "#111111", about: "Parliamentary debate practice and public speaking labs.", gallery: ["#111111"], events: [], announcements: [] },
  { id: "cl6", name: "Music Collective", tagline: "Campus, amplified.", category: "Creative", members: 143, cover: "#F97316", about: "Jam rooms, open mics, and the annual unplugged night.", gallery: ["#F97316", "#6B7280"], events: [], announcements: [] },
];

export const seedEvents: CampusEvent[] = [
  { id: "ev1", title: "ATHENA Winter Hackathon", date: iso(9), time: "09:00", venue: "Innovation Block", category: "Hackathon", seats: 300, registered: 214, about: "36 hours, four tracks, and mentors from six companies.", cover: "#F97316" },
  { id: "ev2", title: "Agentic AI Workshop", date: iso(6), time: "15:00", venue: "Seminar Hall 1", category: "Workshop", seats: 120, registered: 98, about: "Hands-on session on building tool-using agents.", cover: "#111111" },
  { id: "ev3", title: "Sports Fest 2026", date: iso(20), time: "08:00", venue: "Main Ground", category: "Sports", seats: 800, registered: 512, about: "Twelve disciplines across four days.", cover: "#6B7280" },
  { id: "ev4", title: "Competitive Coding Contest", date: iso(3), time: "18:00", venue: "Lab 3", category: "Contest", seats: 150, registered: 141, about: "Two-hour ICPC-style contest with campus leaderboard.", cover: "#F97316" },
  { id: "ev5", title: "Research Symposium", date: iso(14), time: "10:00", venue: "Auditorium", category: "Research", seats: 250, registered: 132, about: "Poster session and faculty keynotes.", cover: "#111111" },
  { id: "ev6", title: "RoboSprint 4.0", date: iso(2), time: "10:00", venue: "Innovation Lab", category: "Contest", seats: 100, registered: 88, about: "Line follower and maze solving challenge.", cover: "#F97316" },
];

export const seedBooks: Book[] = [
  { id: "b1", title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", category: "Computer Science", isbn: "9781449373320", copies: 3, rating: 4.8, year: 2017 },
  { id: "b2", title: "Pattern Recognition and Machine Learning", author: "Christopher Bishop", category: "Computer Science", isbn: "9780387310732", copies: 2, rating: 4.6, year: 2006 },
  { id: "b3", title: "The Design of Everyday Things", author: "Don Norman", category: "Design", isbn: "9780465050659", copies: 5, rating: 4.7, year: 2013 },
  { id: "b4", title: "Computer Networking: A Top-Down Approach", author: "Kurose & Ross", category: "Computer Science", isbn: "9780133594140", copies: 0, rating: 4.4, year: 2016 },
  { id: "b5", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Psychology", isbn: "9780374533557", copies: 4, rating: 4.5, year: 2011 },
  { id: "b6", title: "Clean Architecture", author: "Robert C. Martin", category: "Computer Science", isbn: "9780134494166", copies: 2, rating: 4.3, year: 2017 },
  { id: "b7", title: "Sapiens", author: "Yuval Noah Harari", category: "History", isbn: "9780062316097", copies: 6, rating: 4.6, year: 2014 },
  { id: "b8", title: "Introduction to Algorithms", author: "Cormen et al.", category: "Computer Science", isbn: "9780262046305", copies: 1, rating: 4.7, year: 2022 },
];

export const seedJobs: Job[] = [
  { id: "j1", company: "Northwind Analytics", role: "SDE Intern", type: "Internship", location: "Bengaluru (Hybrid)", ctc: "₹80k / month", deadline: iso(4), skills: ["TypeScript", "SQL", "System Design"], about: "Six-month internship on the data platform team with a pre-placement offer track.", interview: `${iso(11)} · 10:00 · Online` },
  { id: "j2", company: "Halcyon Labs", role: "ML Engineer", type: "Full-time", location: "Hyderabad", ctc: "₹18 LPA", deadline: iso(8), skills: ["Python", "PyTorch", "MLOps"], about: "Build retrieval systems for enterprise search." },
  { id: "j3", company: "Lumen Fintech", role: "Frontend Engineer", type: "Full-time", location: "Remote", ctc: "₹15 LPA", deadline: iso(12), skills: ["React", "TypeScript", "Accessibility"], about: "Own the trading dashboard experience." },
  { id: "j4", company: "Vector Robotics", role: "Embedded Intern", type: "Internship", location: "Pune", ctc: "₹45k / month", deadline: iso(6), skills: ["C", "RTOS", "Sensors"], about: "Firmware for autonomous warehouse robots." },
  { id: "j5", company: "Solstice Cloud", role: "SRE Associate", type: "Full-time", location: "Chennai", ctc: "₹14 LPA", deadline: iso(15), skills: ["Linux", "Kubernetes", "Go"], about: "Keep a multi-region platform boringly reliable." },
];

export const seedPapers: Paper[] = [
  { id: "rp1", title: "Federated Learning for Campus IoT Telemetry", authors: "A. Verma, M. Krishnan", venue: "NCICT 2026", year: 2026, area: "Machine Learning", abstract: "A privacy-preserving aggregation scheme for 4,000 campus sensors.", kind: "paper" },
  { id: "rp2", title: "Query Plan Caching in Teaching Databases", authors: "A. Iyer", venue: "ACM SIGMOD Workshop", year: 2025, area: "Databases", abstract: "Reduces median lab query latency by 41%.", kind: "paper" },
  { id: "rp3", title: "ATHENA Campus Digital Twin", authors: "Research Cell", venue: "Internal Project", year: 2026, area: "Systems", abstract: "Simulation of energy and occupancy across eleven buildings.", kind: "project" },
  { id: "rp4", title: "Accessible Learning Interfaces for Low Bandwidth", authors: "S. Kulkarni, R. Nair", venue: "CHI LBW", year: 2025, area: "HCI", abstract: "Design patterns validated with 120 rural students.", kind: "paper" },
  { id: "rp5", title: "Autonomous Lab Inventory Robot", authors: "Robotics Club", venue: "Internal Project", year: 2026, area: "Robotics", abstract: "SLAM-based stock counting in the electronics lab.", kind: "project" },
];

export const seedAchievements: Achievement[] = [
  { id: "ah1", title: "Winner — Smart Campus Hackathon", issuer: "ATHENA", date: "Mar 2026", kind: "competition", detail: "First place among 96 teams for the attendance-vision project." },
  { id: "ah2", title: "Deep Learning Specialization", issuer: "Coursera", date: "Jan 2026", kind: "certificate", detail: "Five-course specialization completed with distinction." },
  { id: "ah3", title: "100-Day Streak", issuer: "ATHENA", date: "Feb 2026", kind: "badge", detail: "Logged into the campus OS for 100 consecutive days." },
  { id: "ah4", title: "Runner-up — Codeathon", issuer: "IEEE Student Branch", date: "Sep 2025", kind: "competition", detail: "Second of 210 participants." },
  { id: "ah5", title: "Peer Mentor Badge", issuer: "Dean of Students", date: "Aug 2025", kind: "badge", detail: "Mentored twelve first-year students." },
];

export const leaderboard = [
  { rank: 1, name: "Aisha Verma", points: 4820 },
  { rank: 2, name: "Alex Johnson", points: 4460, me: true },
  { rank: 3, name: "Karthik Reddy", points: 4310 },
  { rank: 4, name: "Rahul Nair", points: 3980 },
  { rank: 5, name: "Divya Menon", points: 3775 },
];

export const campusNews = [
  "New quiet study pods open in Block C",
  "Shuttle timings revised from Monday",
  "Campus wifi upgraded to Wi-Fi 6E",
  "Canteen adds a late-night counter",
];

export const avatarFor = AV;

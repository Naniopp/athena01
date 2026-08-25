/**
 * ATHENA access-control matrix — single source of truth shared by UI and server.
 * Permissions are stored in the database (permissions / role_permissions) and
 * enforced by RLS; this file mirrors the catalogue for typing and navigation.
 */

export const ROLES = ["student", "faculty", "hod", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  hod: "Head of Department",
  admin: "Administrator",
  super_admin: "Super Admin",
};

export const PERMISSIONS = [
  "feed.view",
  "posts.create",
  "posts.moderate",
  "communities.create",
  "communities.manage",
  "events.manage",
  "messages.send",
  "attendance.view_own",
  "attendance.view_all",
  "attendance.mark",
  "assignments.manage",
  "assignments.submit",
  "materials.manage",
  "exams.manage",
  "subjects.manage",
  "faculty.assign",
  "timetable.manage",
  "academics.view_dept",
  "students.view",
  "faculty.view",
  "users.view",
  "users.create",
  "users.invite",
  "users.update",
  "users.suspend",
  "departments.view",
  "departments.manage",
  "roles.manage",
  "reports.view",
  "approvals.decide",
  "audit.view_dept",
  "audit.view_all",
  "system.settings",
  "security.manage",
  "admins.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  student: "/dashboard/student",
  faculty: "/dashboard/faculty",
  hod: "/dashboard/hod",
  admin: "/dashboard/admin",
  super_admin: "/dashboard/super-admin",
};

/** Highest-privilege role wins when a user holds several. */
const ROLE_RANK: Record<Role, number> = {
  student: 0,
  faculty: 1,
  hod: 2,
  admin: 3,
  super_admin: 4,
};

export function primaryRole(roles: Role[]): Role {
  if (roles.length === 0) return "student";
  return [...roles].sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0]!;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Role-specific navigation. Deliberately different per role — not one shared menu. */
export interface NavItem {
  label: string;
  to: string;
  icon: string;
  permission?: Permission;
}

export const ROLE_NAV: Record<Role, NavItem[]> = {
  student: [
    { label: "Home", to: "/dashboard/student", icon: "home" },
    { label: "Explore", to: "/dashboard/student/explore", icon: "compass" },
    { label: "Communities", to: "/dashboard/student/clubs", icon: "users" },
    { label: "Events", to: "/dashboard/student/events", icon: "calendar-heart" },
    { label: "Academic", to: "/dashboard/student/courses", icon: "book" },
    { label: "Messages", to: "/dashboard/student/messages", icon: "message" },
    { label: "Bookmarks", to: "/dashboard/student/bookmarks", icon: "bookmark" },
    { label: "Profile", to: "/dashboard/student/profile", icon: "user" },
    { label: "Settings", to: "/dashboard/student/settings", icon: "settings" },
  ],
  faculty: [
    { label: "Home", to: "/dashboard/faculty", icon: "home" },
    { label: "My Classes", to: "/dashboard/faculty/classes", icon: "presentation" },
    { label: "Students", to: "/dashboard/faculty/students", icon: "users", permission: "students.view" },
    { label: "Attendance", to: "/dashboard/faculty/attendance", icon: "check", permission: "attendance.mark" },
    { label: "Assignments", to: "/dashboard/faculty/assignments", icon: "clipboard", permission: "assignments.manage" },
    { label: "Exams", to: "/dashboard/faculty/exams", icon: "file", permission: "exams.manage" },
    { label: "Resources", to: "/dashboard/faculty/resources", icon: "folder", permission: "materials.manage" },
    { label: "Messages", to: "/dashboard/faculty/messages", icon: "message" },
    { label: "Profile", to: "/dashboard/faculty/profile", icon: "user" },
    { label: "Settings", to: "/dashboard/faculty/settings", icon: "settings" },
  ],
  hod: [
    { label: "Overview", to: "/dashboard/hod", icon: "gauge" },
    { label: "Faculty", to: "/dashboard/hod/faculty", icon: "user-cog", permission: "faculty.view" },
    { label: "Students", to: "/dashboard/hod/students", icon: "users", permission: "students.view" },
    { label: "Subjects", to: "/dashboard/hod/subjects", icon: "book", permission: "subjects.manage" },
    { label: "Timetable", to: "/dashboard/hod/timetable", icon: "grid", permission: "timetable.manage" },
    { label: "Approvals", to: "/dashboard/hod/approvals", icon: "check-check", permission: "approvals.decide" },
    { label: "Reports", to: "/dashboard/hod/reports", icon: "chart", permission: "reports.view" },
    { label: "Department Feed", to: "/dashboard/hod/feed", icon: "megaphone" },
    { label: "Settings", to: "/dashboard/hod/settings", icon: "settings" },
  ],
  admin: [
    { label: "Overview", to: "/dashboard/admin", icon: "gauge" },
    { label: "Users", to: "/dashboard/admin/users", icon: "users", permission: "users.view" },
    { label: "Departments", to: "/dashboard/admin/departments", icon: "building", permission: "departments.view" },
    { label: "Communities", to: "/dashboard/admin/communities", icon: "hash", permission: "communities.manage" },
    { label: "Moderation", to: "/dashboard/admin/moderation", icon: "shield", permission: "posts.moderate" },
    { label: "Announcements", to: "/dashboard/admin/announcements", icon: "megaphone" },
    { label: "Reports", to: "/dashboard/admin/reports", icon: "chart", permission: "reports.view" },
    { label: "Activity", to: "/dashboard/admin/activity", icon: "activity", permission: "audit.view_all" },
    { label: "Settings", to: "/dashboard/admin/settings", icon: "settings" },
  ],
  super_admin: [
    { label: "System", to: "/dashboard/super-admin", icon: "server" },
    { label: "Institution", to: "/dashboard/super-admin/institution", icon: "building", permission: "system.settings" },
    { label: "Roles & Permissions", to: "/dashboard/super-admin/roles", icon: "key", permission: "roles.manage" },
    { label: "Administrators", to: "/dashboard/super-admin/admins", icon: "user-cog", permission: "admins.manage" },
    { label: "Security", to: "/dashboard/super-admin/security", icon: "shield", permission: "security.manage" },
    { label: "Audit Logs", to: "/dashboard/super-admin/audit", icon: "scroll", permission: "audit.view_all" },
    { label: "Settings", to: "/dashboard/super-admin/settings", icon: "settings" },
  ],
};

/** Which top-level route prefixes a role may enter. */
export const ROLE_ROUTE_PREFIX: Record<Role, string> = {
  student: "/dashboard/student",
  faculty: "/dashboard/faculty",
  hod: "/dashboard/hod",
  admin: "/dashboard/admin",
  super_admin: "/dashboard/super-admin",
};

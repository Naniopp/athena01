import { defineTool } from "@lovable.dev/mcp-js";

const DASHBOARDS = [
  { role: "student", title: "Student", description: "Attendance, CGPA, timetable, assignments, events." },
  { role: "faculty", title: "Faculty", description: "Classes, attendance, student performance, reviews, analytics." },
  { role: "club", title: "Club", description: "Members, upcoming events, budget, registrations, approvals." },
  { role: "admin", title: "Admin", description: "Campus-wide stats, users, departments, system health, reports." },
];

export default defineTool({
  name: "list_dashboards",
  title: "List ATHENA dashboards",
  description: "List the role-based dashboards available in the ATHENA platform.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(DASHBOARDS) }],
    structuredContent: { dashboards: DASHBOARDS },
  }),
});

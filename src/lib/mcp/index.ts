import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listDashboardsTool from "./tools/list-dashboards";

// OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud proxy),
// which is why we build it from the project ref that Vite inlines at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "athena-mcp",
  title: "ATHENA MCP",
  version: "0.1.0",
  instructions:
    "Tools for the ATHENA AI-powered campus platform. Use `whoami` to identify the signed-in user and `list_dashboards` to discover role-based dashboards.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listDashboardsTool],
});

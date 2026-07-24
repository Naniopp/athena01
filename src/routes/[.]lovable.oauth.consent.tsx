import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OAuthAuthorizationDetails = {
  client?: { name?: string; client_uri?: string } | null;
  scope?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthNamespace = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + (location.searchStr ?? "");
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md rounded-3xl border border-border bg-white p-8 shadow-elegant">
        <h1 className="text-xl font-semibold text-foreground">Authorization unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an application";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setError(null);
    setBusy(approve ? "approve" : "deny");
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(null);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(null);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md animate-rise-in rounded-3xl border border-border bg-white p-8 shadow-elegant">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
            <Sparkles className="h-4 w-4 text-[#F97316]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Connect <span className="text-[#F97316]">{clientName}</span> to ATHENA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {clientName} will be able to use ATHENA as you, calling the enabled tools while you are signed in.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-[#FAFAFA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[#F97316]" />
            <div className="text-sm text-foreground">
              <div className="font-medium">This connection lets {clientName}:</div>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Access ATHENA on your behalf</li>
                <li>• Call ATHENA tools while you are signed in</li>
                {scopes.length > 0 && <li>• Requested scopes: {scopes.join(", ")}</li>}
              </ul>
              <div className="mt-3 text-xs text-muted-foreground">
                ATHENA permissions and backend policies still decide what data is accessible.
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            disabled={busy !== null}
            onClick={() => decide(false)}
            className="flex-1 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60 disabled:opacity-50"
          >
            {busy === "deny" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Cancel"}
          </button>
          <button
            disabled={busy !== null}
            onClick={() => decide(true)}
            className="flex-1 rounded-2xl bg-[#F97316] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 disabled:opacity-50"
          >
            {busy === "approve" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Approve"}
          </button>
        </div>
      </div>
    </main>
  );
}

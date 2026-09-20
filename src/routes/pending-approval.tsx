import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Clock, ShieldCheck, LogOut, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingState } from "@/lib/rbac/onboarding.functions";
import { ROLE_LABEL } from "@/lib/rbac/matrix";

export const Route = createFileRoute("/pending-approval")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { next: location.href } });
  },
  head: () => ({
    meta: [
      { title: "Awaiting approval · ATHENA" },
      { name: "description", content: "Your elevated role request is waiting for a super admin review." },
      { property: "og:title", content: "Awaiting approval · ATHENA" },
      { property: "og:description", content: "Your ATHENA role request is under review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const navigate = useNavigate();
  const fetchState = useServerFn(getOnboardingState);
  const state = useQuery({
    queryKey: ["athena", "onboarding"],
    queryFn: () => fetchState(),
    retry: false,
    refetchInterval: 30_000,
  });

  const requested = state.data?.requestedRole;
  const approved = state.data && state.data.approvalStatus !== "pending";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#F97316]/10 blur-3xl" />
      <header className="relative mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111] text-white">
            <Sparkles className="h-4 w-4 text-[#F97316]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">ATHENA</span>
        </Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login", search: {} }); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <main className="relative mx-auto max-w-lg px-6 pb-24">
        {state.isLoading && (
          <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#F97316]" /></div>
        )}

        {state.data && (
          <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-elegant">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
              {approved ? <ShieldCheck className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
            </div>

            {approved ? (
              <>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">You're all set</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your request has been reviewed. Head to your workspace to continue.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Waiting for approval</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanks {state.data.fullName.split(" ")[0]} — your setup is complete and your request for the{" "}
                  <span className="font-medium text-foreground">
                    {requested ? ROLE_LABEL[requested] : "elevated"}
                  </span>{" "}
                  role is with a super admin. You'll get access as soon as it's approved.
                </p>
                <p className="mt-4 rounded-2xl border border-border bg-[#FAFAFA] p-4 text-left text-sm text-muted-foreground">
                  In the meantime you can use ATHENA with your current access — campus feed, communities,
                  messages and events are all available.
                </p>
              </>
            )}

            <div className="mt-7 flex flex-col items-stretch gap-3">
              <button
                onClick={() => navigate({ href: state.data!.redirectTo })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
              >
                Go to my workspace <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => state.refetch()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                <RefreshCw className={`h-4 w-4 ${state.isFetching ? "animate-spin" : ""}`} /> Check again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

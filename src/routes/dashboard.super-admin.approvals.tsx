import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { decideRoleRequest, listRoleRequests } from "@/lib/rbac/admin.functions";
import { ROLE_LABEL } from "@/lib/rbac/matrix";

export const Route = createFileRoute("/dashboard/super-admin/approvals")({
  component: ApprovalsPage,
});

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "approved"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>{status}</span>
  );
}

function ApprovalsPage() {
  const fetchRequests = useServerFn(listRoleRequests);
  const decide = useServerFn(decideRoleRequest);
  const queryClient = useQueryClient();

  const requests = useQuery({
    queryKey: ["athena", "role-requests"],
    queryFn: () => fetchRequests(),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; decision: "approve" | "reject" }) => decide({ data: input }),
    onSuccess: (_r, input) => {
      toast.success(input.decision === "approve" ? "Role approved" : "Request rejected");
      queryClient.invalidateQueries({ queryKey: ["athena", "role-requests"] });
      queryClient.invalidateQueries({ queryKey: ["athena", "managed-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save that decision."),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Approval requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Head of Department and Administrator requests wait here. You are the highest authority — nothing above needs to approve you.
        </p>
      </header>

      {requests.isLoading && (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#F97316]" /></div>
      )}

      {requests.error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You don't have permission to review approvals.
        </p>
      )}

      {requests.data?.length === 0 && (
        <div className="grid place-items-center rounded-3xl border border-border bg-card p-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No role requests yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {(requests.data ?? []).map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{r.profileName ?? "Unknown user"}</span>
                <StatusPill status={r.status} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {r.profileEmail ?? "no email"} · requests{" "}
                <span className="font-medium text-foreground">
                  {r.requestedRole ? ROLE_LABEL[r.requestedRole] : "unknown role"}
                </span>
              </div>
              {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
            </div>
            {r.status === "pending" && (
              <div className="flex items-center gap-2">
                <button
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ id: r.id, decision: "approve" })}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-[#F97316] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ id: r.id, decision: "reject" })}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

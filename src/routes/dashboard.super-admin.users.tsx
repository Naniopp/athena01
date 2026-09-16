import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { listManagedUsers, setUserRole, setUserStatus } from "@/lib/rbac/admin.functions";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/rbac/matrix";

export const Route = createFileRoute("/dashboard/super-admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const fetchUsers = useServerFn(listManagedUsers);
  const changeRole = useServerFn(setUserRole);
  const changeStatus = useServerFn(setUserStatus);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const users = useQuery({
    queryKey: ["athena", "managed-users"],
    queryFn: () => fetchUsers(),
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["athena", "managed-users"] });
    queryClient.invalidateQueries({ queryKey: ["athena", "session"] });
  };

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: Role; action: "grant" | "revoke" }) =>
      changeRole({ data: input }),
    onSuccess: () => { toast.success("Roles updated"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update roles."),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { userId: string; status: "active" | "suspended" }) =>
      changeStatus({ data: input }),
    onSuccess: () => { toast.success("Account status updated"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the account."),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users.data ?? [];
    return (users.data ?? []).filter(
      (u) => u.name.toLowerCase().includes(term) || (u.email ?? "").toLowerCase().includes(term),
    );
  }, [users.data, q]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users &amp; roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grant or revoke roles and suspend accounts. Every change is checked against your real permissions and written to the audit log.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {users.isLoading && (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#F97316]" /></div>
      )}

      {users.error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You don't have permission to manage users.
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.userId} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{u.name}</span>
                  {u.isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-2.5 py-1 text-xs font-medium text-[#F97316]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Owner
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-muted-foreground">
                    {u.status}
                  </span>
                  {u.approvalStatus === "pending" && u.requestedRole && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                      pending {ROLE_LABEL[u.requestedRole]}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{u.email ?? "no email"}</div>
              </div>
              <button
                disabled={u.isOwner || statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    userId: u.userId,
                    status: u.status === "suspended" ? "active" : "suspended",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              >
                {u.status === "suspended" ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                {u.status === "suspended" ? "Reinstate" : "Suspend"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const has = u.roles.includes(role);
                return (
                  <button
                    key={role}
                    disabled={roleMutation.isPending || (u.isOwner && role === "super_admin")}
                    onClick={() =>
                      roleMutation.mutate({ userId: u.userId, role, action: has ? "revoke" : "grant" })
                    }
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 " +
                      (has
                        ? "border-[#F97316] bg-[#F97316] text-white"
                        : "border-border text-muted-foreground hover:text-foreground")
                    }
                  >
                    {ROLE_LABEL[role]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

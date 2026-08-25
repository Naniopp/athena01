import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySession, type SessionData } from "./session.functions";
import { ROLE_NAV, type NavItem, type Permission, type Role } from "./matrix";

export const sessionQueryKey = ["athena", "session"] as const;

export function useSession() {
  const fetchSession = useServerFn(getMySession);
  const query = useQuery<SessionData>({
    queryKey: sessionQueryKey,
    queryFn: () => fetchSession(),
    staleTime: 60_000,
    retry: false,
  });

  const session = query.data;
  const permissions = session?.permissions ?? [];

  return {
    ...query,
    session,
    role: session?.role,
    roles: session?.roles ?? ([] as Role[]),
    profile: session?.profile,
    can: (permission: Permission) => permissions.includes(permission),
    canAny: (list: Permission[]) => list.some((p) => permissions.includes(p)),
    nav: (session ? ROLE_NAV[session.role] : []).filter(
      (item: NavItem) => !item.permission || permissions.includes(item.permission),
    ),
  };
}

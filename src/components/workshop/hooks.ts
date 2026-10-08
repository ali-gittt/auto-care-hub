import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { profilesQuery, rolesQuery } from "@/lib/workshop/api";

/** Staff-only: id → display name, phone, plus the list of worker-capable users. */
export function usePeople() {
  const profiles = useQuery(profilesQuery());
  const roles = useQuery(rolesQuery());
  return useMemo(() => {
    const p = profiles.data ?? [];
    const r = roles.data ?? [];
    const names = new Map(p.map((x) => [x.id, x.full_name || x.email || "Unknown"]));
    const phones = new Map(p.map((x) => [x.id, x.phone || ""]));
    const profileMap = new Map(p.map((x) => [x.id, x]));
    const roleOf = new Map(r.map((x) => [x.user_id, x.role]));
    const workers = p.filter((x) => roleOf.get(x.id) === "worker" || roleOf.get(x.id) === "admin");
    return {
      profiles: p,
      names,
      phones,
      profileMap,
      roleOf,
      workers,
      loading: profiles.isLoading || roles.isLoading,
    };
  }, [profiles.data, roles.data, profiles.isLoading, roles.isLoading]);
}

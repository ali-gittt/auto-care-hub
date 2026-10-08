import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setRole } from "@/lib/workshop/api";
import type { AppRole } from "@/lib/workshop/types";
import { usePeople } from "@/components/workshop/hooks";
import { Empty, Initials, PageHeader, Panel } from "@/components/workshop/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/_admin/admin/workers")({
  head: () => ({ meta: [{ title: "Workers & roles — TorqueWorks" }] }),
  component: Workers,
});

function Workers() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { profiles, roleOf, loading } = usePeople();
  const m = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AppRole }) => setRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); toast.success("Role updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const sorted = [...profiles].sort((a, b) => (roleOf.get(a.id) ?? "z").localeCompare(roleOf.get(b.id) ?? "z"));

  return (
    <>
      <PageHeader eyebrow="Admin · Team" title="WORKERS &" accent="ROLES" />
      <Panel flush title="Everyone with an account"
        meta={<span className="eyebrow">New sign-ups start as customers</span>}>
        {loading ? <Empty>Loading…</Empty> : (
          <div className="divide-y divide-border">
            {sorted.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <Initials text={p.full_name || p.email || ""} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{p.full_name || "—"}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{p.email}</p>
                </div>
                <Select value={roleOf.get(p.id) ?? "customer"} disabled={p.id === user.id || m.isPending}
                  onValueChange={(v) => m.mutate({ id: p.id, role: v as AppRole })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Shield, Users, Wrench, X } from "lucide-react";
import { setRole } from "@/lib/workshop/api";
import type { AppRole } from "@/lib/workshop/types";
import { usePeople } from "@/components/workshop/hooks";
import { Empty, Initials, PageHeader, Panel } from "@/components/workshop/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/admin/workers")({
  head: () => ({ meta: [{ title: "Team & Role Access — TorqueWorks" }] }),
  component: Workers,
});

const roleStyles: Record<AppRole, string> = {
  admin: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  worker: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  customer: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

function Workers() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { profiles, roleOf, loading } = usePeople();
  const [search, setSearch] = useState("");

  const m = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AppRole }) => setRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sorted = useMemo(() => {
    return [...profiles].sort((a, b) =>
      (roleOf.get(a.id) ?? "z").localeCompare(roleOf.get(b.id) ?? "z")
    );
  }, [profiles, roleOf]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter((p) => {
      const name = (p.full_name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const phone = (p.phone || "").toLowerCase();
      const role = (roleOf.get(p.id) || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
    });
  }, [sorted, search, roleOf]);

  return (
    <>
      <PageHeader eyebrow="Administration · Staff & Permissions" title="TEAM &" accent="ROLES">
        {/* Search bar in header or controls */}
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 bg-card border-border/80 text-sm font-sans focus:border-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </PageHeader>

      <Panel
        flush
        title="Personnel & Registered Users"
        meta={
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            {search ? (
              <span>
                Found <span className="font-bold text-primary">{filtered.length}</span> of {profiles.length} users
              </span>
            ) : (
              <span>{profiles.length} total registered accounts</span>
            )}
          </div>
        }
      >
        {loading ? (
          <Empty>Loading account permissions…</Empty>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-border bg-secondary/30 text-muted-foreground">
              <Search className="size-5" />
            </div>
            <p className="font-mono text-sm font-semibold text-foreground">
              No users matching "{search}"
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try searching with another name, email address, or clear your query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="mt-4 text-xs font-mono"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((p) => {
              const currentRole = (roleOf.get(p.id) ?? "customer") as AppRole;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-4.5 hover:bg-secondary/30 transition-colors"
                >
                  <Initials text={p.full_name || p.email || ""} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {p.full_name || "Unspecified Name"}
                      </p>
                      {p.id === user.id && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="font-mono text-xs text-muted-foreground">{p.email}</p>
                      {p.phone && (
                        <span className="font-mono text-[11px] text-muted-foreground/80">
                          · {p.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                        roleStyles[currentRole]
                      )}
                    >
                      {currentRole}
                    </span>

                    <Select
                      value={currentRole}
                      disabled={p.id === user.id || m.isPending}
                      onValueChange={(v) => m.mutate({ id: p.id, role: v as AppRole })}
                    >
                      <SelectTrigger className="w-36 font-mono text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="worker">Worker / Mechanic</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Plus, Trash2 } from "lucide-react";
import { deleteService, servicesQuery, upsertService } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import { Empty, PageHeader, Panel } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/_admin/admin/prices")({
  head: () => ({ meta: [{ title: "Service Catalog & Pricing — TorqueWorks" }] }),
  component: Prices,
});

function Prices() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(servicesQuery());
  const [draft, setDraft] = useState({ name: "", price: "", est_hours: "1" });
  const done = () => qc.invalidateQueries({ queryKey: ["services"] });
  const save = useMutation({
    mutationFn: upsertService,
    onSuccess: done,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: deleteService,
    onSuccess: done,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Administration · Workshop Tariff" title="PRICE" accent="CATALOG" />
      <Panel
        flush
        title="Standard Repair & Maintenance Services"
        meta={
          <span className="font-mono text-xs text-muted-foreground">
            {data.length} registered services
          </span>
        }
      >
        {isLoading ? (
          <Empty>Loading pricing ledger…</Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {data.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-4 px-6 py-3.5 hover:bg-secondary/30 transition-colors"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-bold text-foreground">{s.name}</p>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <Clock className="size-3.5 text-primary" />
                  <span>{s.est_hours}h estimated</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                      €
                    </span>
                    <Input
                      className="w-28 pl-6 font-mono text-xs bg-background"
                      type="number"
                      min={0}
                      defaultValue={s.price}
                      onBlur={(e) =>
                        Number(e.target.value) !== Number(s.price) &&
                        save.mutate({ id: s.id, name: s.name, price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-sm font-black text-foreground">
                    {money(Number(s.price))}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => del.mutate(s.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {data.length === 0 && <Empty>No standard services recorded yet.</Empty>}
          </div>
        )}

        {/* Add service form */}
        <form
          className="flex flex-wrap items-center gap-3 border-t border-border/70 bg-secondary/20 px-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim() || !draft.price) return;
            save.mutate(
              {
                name: draft.name.trim(),
                price: Number(draft.price),
                est_hours: Number(draft.est_hours) || 1,
              },
              { onSuccess: () => setDraft({ name: "", price: "", est_hours: "1" }) }
            );
          }}
        >
          <Input
            className="min-w-[200px] flex-1 bg-background text-sm"
            placeholder="Add new service title (e.g. Brake Caliper Replacement)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
              €
            </span>
            <Input
              className="w-28 pl-6 bg-background font-mono text-xs"
              type="number"
              placeholder="Price"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            />
          </div>
          <Input
            className="w-24 bg-background font-mono text-xs"
            type="number"
            step="0.5"
            placeholder="Hours"
            value={draft.est_hours}
            onChange={(e) => setDraft({ ...draft, est_hours: e.target.value })}
          />
          <Button
            type="submit"
            size="sm"
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90"
          >
            <Plus className="size-4 mr-1" /> Add Service
          </Button>
        </form>
      </Panel>
    </>
  );
}

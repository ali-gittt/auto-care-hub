import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { deleteService, servicesQuery, upsertService } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import { Empty, PageHeader, Panel } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/_admin/admin/prices")({
  head: () => ({ meta: [{ title: "Price list — TorqueWorks" }] }),
  component: Prices,
});

function Prices() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(servicesQuery());
  const [draft, setDraft] = useState({ name: "", price: "", est_hours: "1" });
  const done = () => qc.invalidateQueries({ queryKey: ["services"] });
  const save = useMutation({ mutationFn: upsertService, onSuccess: done, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: deleteService, onSuccess: done, onError: (e: Error) => toast.error(e.message) });

  return (
    <>
      <PageHeader eyebrow="Admin · Pricing" title="PRICE" accent="LIST" />
      <Panel flush title="Services">
        {isLoading ? <Empty>Loading…</Empty> : (
          <div className="divide-y divide-border">
            {data.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-4 px-6 py-3">
                <p className="min-w-[200px] flex-1 text-[14px] font-bold">{s.name}</p>
                <span className="font-mono text-[11px] text-muted-foreground">{s.est_hours}h est.</span>
                <Input className="w-28" type="number" min={0} defaultValue={s.price}
                  onBlur={(e) => Number(e.target.value) !== Number(s.price) && save.mutate({ id: s.id, name: s.name, price: Number(e.target.value) })} />
                <span className="w-20 text-right font-black">{money(Number(s.price))}</span>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}>Remove</Button>
              </div>
            ))}
            {data.length === 0 && <Empty>No services yet.</Empty>}
          </div>
        )}
        <form className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim() || !draft.price) return;
            save.mutate({ name: draft.name.trim(), price: Number(draft.price), est_hours: Number(draft.est_hours) || 1 },
              { onSuccess: () => setDraft({ name: "", price: "", est_hours: "1" }) });
          }}>
          <Input className="min-w-[200px] flex-1" placeholder="New service name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input className="w-28" type="number" placeholder="Price €" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <Input className="w-24" type="number" step="0.5" placeholder="Hours" value={draft.est_hours} onChange={(e) => setDraft({ ...draft, est_hours: e.target.value })} />
          <Button type="submit">Add</Button>
        </form>
      </Panel>
    </>
  );
}

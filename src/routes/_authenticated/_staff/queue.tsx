import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { appointmentsQuery, updateAppointment } from "@/lib/workshop/api";
import type { Appointment } from "@/lib/workshop/types";
import { Empty, Initials, PageHeader, Panel, StatusBadge, fmtDate } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/_staff/queue")({
  head: () => ({ meta: [{ title: "Incoming appointments — TorqueWorks" }] }),
  component: Queue,
});

function Queue() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const pending = data.filter((a) => a.status === "pending");
  const upcoming = data.filter((a) => a.status === "confirmed").sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  const [accepting, setAccepting] = useState<Appointment | null>(null);
  const [when, setWhen] = useState("");

  const m = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Appointment> }) => updateAppointment(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function accept() {
    if (!accepting || !when) { toast.error("Pick a date and time"); return; }
    m.mutate(
      { id: accepting.id, patch: { status: "confirmed", scheduled_at: new Date(when).toISOString(), worker_id: user.id } },
      { onSuccess: () => { toast.success("Appointment confirmed"); setAccepting(null); setWhen(""); } },
    );
  }

  return (
    <>
      <PageHeader eyebrow="Workshop floor · Intake" title="INCOMING" accent="QUEUE" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Incoming appointments" flush
          meta={<span className="eyebrow text-primary">{pending.length} new</span>}>
          {isLoading ? <Empty>Loading…</Empty> : pending.length === 0 ? <Empty>Queue is clear.</Empty> : (
            <div className="divide-y divide-border">
              {pending.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-foreground/[0.03]">
                  <Initials text={`${a.first_name} ${a.last_name}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold">{a.first_name} {a.last_name} · {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{a.license_plate} · {a.problem_description}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => setAccepting(a)}>Accept</Button>
                    <Button size="sm" variant="outline" disabled={m.isPending}
                      onClick={() => m.mutate({ id: a.id, patch: { status: "rejected", worker_id: user.id } })}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Scheduled" flush>
          {upcoming.length === 0 ? <Empty>Nothing scheduled.</Empty> : (
            <div className="divide-y divide-border">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold">{a.vehicle_make} {a.vehicle_model}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{fmtDate(a.scheduled_at)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Dialog open={!!accepting} onOpenChange={(o) => !o && setAccepting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-black">Schedule repair</DialogTitle></DialogHeader>
          {accepting && (
            <p className="font-mono text-xs text-muted-foreground">
              {accepting.vehicle_year} {accepting.vehicle_make} {accepting.vehicle_model} · {accepting.license_plate}
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="eyebrow" htmlFor="when">Date & time</Label>
            <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccepting(null)}>Cancel</Button>
            <Button onClick={accept} disabled={m.isPending}>Confirm appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

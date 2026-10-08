import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { appointmentsQuery, updateAppointment } from "@/lib/workshop/api";
import { NEXT_STATUS, STATUS_LABEL, type Appointment, type AppointmentStatus, type PaymentStatus } from "@/lib/workshop/types";
import { Empty, Initials, PageHeader, Panel, StatusBadge, fmtDate } from "@/components/workshop/ui";
import { usePeople } from "@/components/workshop/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_staff/repairs")({
  head: () => ({ meta: [{ title: "Repairs — TorqueWorks" }] }),
  component: Repairs,
});

const TABS: AppointmentStatus[] = ["confirmed", "in_repair", "completed"];

function Repairs() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const { names } = usePeople();
  const [tab, setTab] = useState<AppointmentStatus>("confirmed");
  const rows = data.filter((a) => a.status === tab);

  const m = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Appointment> }) => updateAppointment(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Workshop floor · Jobs" title="REPAIR" accent="BOARD">
        <div className="flex gap-1.5 rounded-md border border-border bg-card p-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-sm px-3.5 py-1.5 text-xs font-bold uppercase",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {STATUS_LABEL[t]} · {data.filter((a) => a.status === t).length}
            </button>
          ))}
        </div>
      </PageHeader>
      <Panel flush>
        {isLoading ? <Empty>Loading…</Empty> : rows.length === 0 ? <Empty>No repairs in this stage.</Empty> : (
          <div className="divide-y divide-border">
            {rows.map((a) => <RepairRow key={a.id} a={a} worker={a.worker_id ? names.get(a.worker_id) : undefined}
              onSave={(patch) => m.mutate({ id: a.id, patch })} busy={m.isPending} />)}
          </div>
        )}
      </Panel>
    </>
  );
}

function RepairRow({ a, worker, onSave, busy }: { a: Appointment; worker?: string; onSave: (p: Partial<Appointment>) => void; busy: boolean }) {
  const [cost, setCost] = useState(a.cost != null ? String(a.cost) : "");
  const next = NEXT_STATUS[a.status];
  return (
    <div className="flex flex-wrap items-center gap-4 px-6 py-4">
      <Initials text={`${a.first_name} ${a.last_name}`} />
      <div className="min-w-[220px] flex-1">
        <p className="text-[14px] font-bold">{a.first_name} {a.last_name} · {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{a.license_plate} · {a.problem_description}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{fmtDate(a.scheduled_at)}{worker ? ` · ${worker}` : ""}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input className="w-24" type="number" min={0} placeholder="Cost €" value={cost} onChange={(e) => setCost(e.target.value)}
          onBlur={() => cost !== String(a.cost ?? "") && onSave({ cost: cost === "" ? null : Number(cost) })} />
        <Select value={a.payment_status} onValueChange={(v) => onSave({ payment_status: v as PaymentStatus })}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <StatusBadge status={a.status} />
      {next && <Button size="sm" disabled={busy} onClick={() => onSave({ status: next })}>→ {STATUS_LABEL[next]}</Button>}
    </div>
  );
}

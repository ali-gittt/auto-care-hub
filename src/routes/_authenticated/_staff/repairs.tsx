import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Calendar, ChevronRight, Eye, Phone, User, Wrench } from "lucide-react";
import { appointmentsQuery, updateAppointment } from "@/lib/workshop/api";
import {
  NEXT_STATUS,
  STATUS_LABEL,
  type Appointment,
  type AppointmentStatus,
  type PaymentStatus,
} from "@/lib/workshop/types";
import {
  Empty,
  Initials,
  LicensePlateBadge,
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
  fmtDate,
} from "@/components/workshop/ui";
import { usePeople } from "@/components/workshop/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RepairedCarModal } from "@/components/workshop/repaired-car-modal";

export const Route = createFileRoute("/_authenticated/_staff/repairs")({
  head: () => ({ meta: [{ title: "Repair Floor Board — TorqueWorks" }] }),
  component: Repairs,
});

const TABS: AppointmentStatus[] = ["confirmed", "in_repair", "completed"];

function Repairs() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const { names, phones } = usePeople();
  const [tab, setTab] = useState<AppointmentStatus>("confirmed");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const rows = data.filter((a) => a.status === tab);

  const m = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Appointment> }) =>
      updateAppointment(id, patch),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (selectedAppointment && selectedAppointment.id === updated.id) {
        setSelectedAppointment(updated);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentWorkerFullName =
    names.get(user.id) || (user.user_metadata?.["full_name"] as string) || "TorqueWorks Technician";

  return (
    <>
      <PageHeader
        eyebrow="Workshop Floor · Active Pipeline"
        title="REPAIR"
        accent="BOARD"
      >
        <div className="flex gap-1.5 rounded-xl border border-border/70 bg-card p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition-all",
                tab === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              {STATUS_LABEL[t]} · {data.filter((a) => a.status === t).length}
            </button>
          ))}
        </div>
      </PageHeader>

      <Panel flush>
        {isLoading ? (
          <Empty>Loading repair bay records…</Empty>
        ) : rows.length === 0 ? (
          <Empty>No repairs currently in this stage.</Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((a) => {
              const mechanicFullName =
                (a.worker_id ? names.get(a.worker_id) : undefined) ||
                a.worker_notes ||
                "TorqueWorks Mechanic";

              return (
                <RepairRow
                  key={a.id}
                  a={a}
                  worker={mechanicFullName}
                  phone={phones.get(a.customer_id)}
                  onSave={(patch) => m.mutate({ id: a.id, patch })}
                  onInspect={() => setSelectedAppointment(a)}
                  onAdvance={(nextStatus) => {
                    m.mutate({
                      id: a.id,
                      patch: {
                        status: nextStatus,
                        worker_id: a.worker_id ?? user.id,
                        worker_notes: a.worker_notes || currentWorkerFullName,
                        ...(nextStatus === "completed"
                          ? { completed_at: new Date().toISOString() }
                          : nextStatus === "in_repair"
                            ? { started_at: new Date().toISOString() }
                            : {}),
                      },
                    });
                  }}
                  busy={m.isPending}
                />
              );
            })}
          </div>
        )}
      </Panel>

      {/* Repaired Car Modal: Shows car info, paid status, and Repaired By mechanic */}
      <RepairedCarModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(o) => !o && setSelectedAppointment(null)}
        mechanicName={
          selectedAppointment
            ? (selectedAppointment.worker_id ? names.get(selectedAppointment.worker_id) : undefined) ||
              selectedAppointment.worker_notes ||
              "TorqueWorks Mechanic"
            : undefined
        }
        customerPhone={
          selectedAppointment ? phones.get(selectedAppointment.customer_id) : undefined
        }
        isStaff={true}
        onTogglePayment={(newStatus) => {
          if (!selectedAppointment) return;
          m.mutate({
            id: selectedAppointment.id,
            patch: { payment_status: newStatus },
          });
        }}
        busy={m.isPending}
      />
    </>
  );
}

function RepairRow({
  a,
  worker,
  phone,
  onSave,
  onInspect,
  onAdvance,
  busy,
}: {
  a: Appointment;
  worker?: string | undefined;
  phone?: string | undefined;
  onSave: (p: Partial<Appointment>) => void;
  onInspect: () => void;
  onAdvance: (next: AppointmentStatus) => void;
  busy: boolean;
}) {
  const [cost, setCost] = useState(a.cost != null ? String(a.cost) : "");
  const next = NEXT_STATUS[a.status];
  const isCompleted = a.status === "completed";

  return (
    <div
      onClick={onInspect}
      className="group flex cursor-pointer flex-wrap items-center gap-4 px-6 py-4.5 hover:bg-secondary/30 transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInspect();
        }
      }}
    >
      <Initials text={`${a.first_name} ${a.last_name}`} />

      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {a.first_name} {a.last_name}
          </p>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-xs font-semibold text-foreground/90">
            {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}
          </span>
          <LicensePlateBadge plate={a.license_plate} />
        </div>

        <p className="mt-1 line-clamp-1 font-mono text-xs text-muted-foreground">
          “{a.problem_description}”
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3 text-muted-foreground" />
            {fmtDate(a.scheduled_at)}
          </span>

          {phone && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="size-3 text-primary" />
              {phone}
            </span>
          )}

          {/* Prominently show mechanic who repaired / is repairing */}
          {worker && (
            <span
              className={cn(
                "flex items-center gap-1 font-semibold",
                isCompleted
                  ? "text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md"
                  : "text-foreground/90"
              )}
            >
              <Wrench className="size-3 text-primary" />
              {isCompleted ? `Repaired by: ${worker}` : `Mechanic: ${worker}`}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
            €
          </span>
          <Input
            className="w-24 pl-6 font-mono text-xs bg-background"
            type="number"
            min={0}
            placeholder="Cost"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onBlur={() =>
              cost !== String(a.cost ?? "") &&
              onSave({ cost: cost === "" ? null : Number(cost) })
            }
          />
        </div>

        <Select
          value={a.payment_status}
          onValueChange={(v) => onSave({ payment_status: v as PaymentStatus })}
        >
          <SelectTrigger className="w-28 font-mono text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="shrink-0">
        <StatusBadge status={a.status} />
      </div>

      {next && (
        <Button
          size="sm"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(next);
          }}
          className="bg-primary text-primary-foreground font-black uppercase text-xs hover:bg-primary/90 shadow-sm shrink-0"
        >
          <span>→ {STATUS_LABEL[next]}</span>
          <ArrowRight className="size-3.5 ml-1" />
        </Button>
      )}

      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </div>
  );
}

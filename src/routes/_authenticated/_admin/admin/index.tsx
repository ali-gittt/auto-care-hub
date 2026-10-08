import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, Eye } from "lucide-react";
import { appointmentsQuery } from "@/lib/workshop/api";
import { computeStats, duration, money, resolveRange, type RangePreset } from "@/lib/workshop/stats";
import type { Appointment } from "@/lib/workshop/types";
import {
  Bar,
  Empty,
  Initials,
  KpiStrip,
  LicensePlateBadge,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/workshop/ui";
import { usePeople } from "@/components/workshop/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderDetailsModal } from "@/components/workshop/order-details-modal";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  head: () => ({ meta: [{ title: "Workshop statistics — TorqueWorks" }] }),
  component: AdminDashboard,
});

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "custom", label: "Custom" },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function AdminDashboard() {
  const { user } = Route.useRouteContext();
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const { names, phones } = usePeople();
  const [preset, setPreset] = useState<RangePreset>("month");
  const [from, setFrom] = useState(iso(new Date(Date.now() - 30 * 864e5)));
  const [to, setTo] = useState(iso(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const range = useMemo(
    () => resolveRange(preset, new Date(), { from: new Date(from), to: new Date(to) }),
    [preset, from, to]
  );
  const s = useMemo(() => computeStats(data, range), [data, range]);
  const maxProblem = s.commonProblems[0]?.count ?? 0;
  const maxWorker = s.workers[0]?.completed ?? 0;
  const pending = data.filter((a) => a.status === "pending").slice(0, 5);

  return (
    <>
      <PageHeader eyebrow="Executive · Workshop Pulse" title="PERFORMANCE" accent="DASHBOARD">
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg border border-border/70 bg-card p-1 shadow-sm">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs uppercase transition-all",
                  preset === p.id
                    ? "bg-primary font-bold text-primary-foreground shadow-sm"
                    : "font-semibold text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-36 bg-card text-xs font-mono"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-36 bg-card text-xs font-mono"
              />
            </div>
          )}
        </div>
      </PageHeader>

      <KpiStrip
        items={[
          { label: "Revenue", value: money(s.revenue), sub: "Paid, completed repairs", hot: true },
          { label: "Appointments", value: s.appointments, sub: `${s.pending} pending intake` },
          { label: "Avg repair cost", value: money(s.avgCost), sub: `across ${s.completedRepairs} jobs` },
          { label: "Avg duration", value: duration(s.avgDurationHours), sub: "In Repair → Completed" },
        ]}
      />
      <KpiStrip
        items={[
          { label: "Total Repairs", value: s.repairs },
          { label: "Active in Bays", value: s.activeRepairs, sub: "Confirmed + In Repair", hot: s.activeRepairs > 0 },
          { label: "Completed", value: s.completedRepairs },
          { label: "Rejected Requests", value: s.rejected, hot: s.rejected > 0 },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Common Vehicle Issues" className="lg:col-span-2">
          {s.commonProblems.length === 0 ? (
            <Empty>{isLoading ? "Loading…" : "No appointments in this range."}</Empty>
          ) : (
            <div className="space-y-4">
              {s.commonProblems.map((p, i) => (
                <div key={p.label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-foreground">{p.label}</span>
                    <span className="font-mono text-muted-foreground">{p.count} instances</span>
                  </div>
                  <Bar value={p.count} max={maxProblem} strong={i === 0} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Technician Performance" flush>
          {s.workers.length === 0 ? (
            <Empty>No completed work yet.</Empty>
          ) : (
            <div className="space-y-5 p-6">
              {s.workers.map((w, i) => (
                <div key={w.workerId}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {names.get(w.workerId) ?? "Worker"}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {w.completed} done · {w.active} active · {duration(w.avgHours)}
                    </span>
                  </div>
                  <Bar value={w.completed} max={maxWorker} strong={i === 0} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Incoming Queue (Click to review details)"
        flush
        meta={
          <Button asChild variant="ghost" size="sm" className="font-mono text-xs text-primary hover:text-primary">
            <Link to="/queue">
              Open Full Queue ({data.filter((a) => a.status === "pending").length}) →
            </Link>
          </Button>
        }
      >
        {pending.length === 0 ? (
          <Empty>No pending requests.</Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {pending.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedAppointment(a)}
                className="group flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedAppointment(a);
                  }
                }}
              >
                <Initials text={`${a.first_name} ${a.last_name}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {a.first_name} {a.last_name}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-foreground/90 font-medium">
                      {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}
                    </span>
                    <LicensePlateBadge plate={a.license_plate} />
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground mt-0.5">
                    “{a.problem_description}”
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden sm:inline-flex text-xs font-semibold group-hover:border-primary group-hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppointment(a);
                    }}
                  >
                    <Eye className="size-3.5 mr-1" />
                    Review
                  </Button>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Order Details Modal for Admin */}
      <OrderDetailsModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        currentUserId={user.id}
        workerName={names.get(user.id) || (user.user_metadata?.full_name as string)}
        customerPhone={selectedAppointment ? phones.get(selectedAppointment.customer_id) : undefined}
      />
    </>
  );
}

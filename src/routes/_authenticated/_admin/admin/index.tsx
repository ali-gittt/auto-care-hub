import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { appointmentsQuery } from "@/lib/workshop/api";
import { computeStats, duration, money, resolveRange, type RangePreset } from "@/lib/workshop/stats";
import { Bar, Empty, Initials, KpiStrip, PageHeader, Panel, StatusBadge } from "@/components/workshop/ui";
import { usePeople } from "@/components/workshop/hooks";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  head: () => ({ meta: [{ title: "Workshop statistics — TorqueWorks" }] }),
  component: AdminDashboard,
});

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Today" }, { id: "week", label: "Week" }, { id: "month", label: "Month" },
  { id: "year", label: "Year" }, { id: "custom", label: "Custom" },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function AdminDashboard() {
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const { names } = usePeople();
  const [preset, setPreset] = useState<RangePreset>("month");
  const [from, setFrom] = useState(iso(new Date(Date.now() - 30 * 864e5)));
  const [to, setTo] = useState(iso(new Date()));
  const range = useMemo(() => resolveRange(preset, new Date(), { from: new Date(from), to: new Date(to) }), [preset, from, to]);
  const s = useMemo(() => computeStats(data, range), [data, range]);
  const maxProblem = s.commonProblems[0]?.count ?? 0;
  const maxWorker = s.workers[0]?.completed ?? 0;
  const pending = data.filter((a) => a.status === "pending").slice(0, 5);

  return (
    <>
      <PageHeader eyebrow="Performance · Live" title="WORKSHOP" accent="PULSE">
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-card p-1">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => setPreset(p.id)}
                className={cn("rounded-sm px-3.5 py-1.5 text-xs uppercase",
                  preset === p.id ? "bg-primary font-bold text-primary-foreground" : "font-semibold text-muted-foreground hover:text-foreground")}>
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
              <span className="text-muted-foreground">→</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
          )}
        </div>
      </PageHeader>

      <KpiStrip items={[
        { label: "Revenue", value: money(s.revenue), sub: "Paid, completed repairs", hot: true },
        { label: "Appointments", value: s.appointments, sub: `${s.pending} pending intake` },
        { label: "Avg repair cost", value: money(s.avgCost), sub: `across ${s.completedRepairs} jobs` },
        { label: "Avg duration", value: duration(s.avgDurationHours), sub: "In Repair → Completed" },
      ]} />
      <KpiStrip items={[
        { label: "Repairs", value: s.repairs },
        { label: "Active repairs", value: s.activeRepairs, sub: "Confirmed + In Repair" },
        { label: "Completed", value: s.completedRepairs },
        { label: "Rejected", value: s.rejected, hot: s.rejected > 0 },
      ]} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Common problems" className="lg:col-span-2">
          {s.commonProblems.length === 0 ? <Empty>{isLoading ? "Loading…" : "No appointments in this range."}</Empty> : (
            <div className="space-y-4">
              {s.commonProblems.map((p, i) => (
                <div key={p.label}>
                  <div className="mb-1.5 flex justify-between text-[12px]"><span>{p.label}</span><span className="font-mono text-muted-foreground">{p.count}</span></div>
                  <Bar value={p.count} max={maxProblem} strong={i === 0} />
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Worker performance" flush>
          {s.workers.length === 0 ? <Empty>No completed work yet.</Empty> : (
            <div className="space-y-5 p-6">
              {s.workers.map((w, i) => (
                <div key={w.workerId}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-bold">{names.get(w.workerId) ?? "Worker"}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{w.completed} done · {w.active} active · {duration(w.avgHours)}</span>
                  </div>
                  <Bar value={w.completed} max={maxWorker} strong={i === 0} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Incoming appointments" flush
        meta={<Link to="/queue" className="eyebrow text-primary">Open queue →</Link>}>
        {pending.length === 0 ? <Empty>No pending requests.</Empty> : (
          <div className="divide-y divide-border">
            {pending.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                <Initials text={`${a.first_name} ${a.last_name}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{a.first_name} {a.last_name} · {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{a.license_plate} · {a.problem_description}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

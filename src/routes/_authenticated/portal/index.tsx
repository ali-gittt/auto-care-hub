import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appointmentsQuery } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import { Empty, Initials, KpiStrip, PageHeader, Panel, PaymentBadge, StatusBadge, fmtDate } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({ meta: [{ title: "My vehicles — TorqueWorks" }] }),
  component: Portal,
});

function Portal() {
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const active = data.filter((a) => a.status === "confirmed" || a.status === "in_repair").length;
  const due = data.filter((a) => a.status === "completed" && a.payment_status === "unpaid").reduce((s, a) => s + Number(a.cost ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Customer · Garage" title="MY" accent="VEHICLES">
        <Button asChild><Link to="/portal/book">Book a service</Link></Button>
      </PageHeader>
      <KpiStrip
        items={[
          { label: "Appointments", value: data.length },
          { label: "Awaiting review", value: data.filter((a) => a.status === "pending").length },
          { label: "Active repairs", value: active, hot: active > 0, sub: active ? "In the workshop now" : undefined },
          { label: "Balance due", value: money(due) },
        ]}
      />
      <Panel title="Appointments & repairs" flush>
        {isLoading ? <Empty>Loading…</Empty> : data.length === 0 ? <Empty>No appointments yet — book your first service.</Empty> : (
          <div className="divide-y divide-border">
            {data.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <Initials text={`${a.vehicle_make} ${a.vehicle_model}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{a.vehicle_year} {a.vehicle_make} {a.vehicle_model}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{a.license_plate} · {a.problem_description}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">Slot: {fmtDate(a.scheduled_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-black">{a.cost != null ? money(Number(a.cost)) : "—"}</p>
                  <PaymentBadge status={a.payment_status} />
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

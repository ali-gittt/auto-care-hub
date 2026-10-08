import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { appointmentsQuery } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import { Empty, Initials, PageHeader, Panel, StatusBadge } from "@/components/workshop/ui";

export const Route = createFileRoute("/_authenticated/_admin/admin/vehicles")({
  head: () => ({ meta: [{ title: "Vehicles — TorqueWorks" }] }),
  component: Vehicles,
});

function Vehicles() {
  const { data = [] } = useQuery(appointmentsQuery());
  // A vehicle is identified by its license plate; latest appointment wins for display.
  const vehicles = useMemo(() => {
    const m = new Map<string, typeof data>();
    for (const a of data) m.set(a.license_plate, [...(m.get(a.license_plate) ?? []), a]);
    return [...m.entries()].map(([plate, list]) => ({ plate, latest: list[0], visits: list.length,
      total: list.reduce((s, a) => s + Number(a.cost ?? 0), 0) }));
  }, [data]);

  return (
    <>
      <PageHeader eyebrow="Admin · Fleet" title="VEHICLE" accent="REGISTER" />
      <Panel flush title="All vehicles" meta={<span className="eyebrow">{vehicles.length} plates</span>}>
        {vehicles.length === 0 ? <Empty>No vehicles yet.</Empty> : (
          <div className="divide-y divide-border">
            {vehicles.map(({ plate, latest: a, visits, total }) => (
              <div key={plate} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <Initials text={`${a.vehicle_make} ${a.vehicle_model}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{a.vehicle_year} {a.vehicle_make} {a.vehicle_model}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{plate} · {a.first_name} {a.last_name}</p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{visits} visits · {money(total)}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

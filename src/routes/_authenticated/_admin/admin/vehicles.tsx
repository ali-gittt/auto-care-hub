import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Car, ChevronRight } from "lucide-react";
import { appointmentsQuery } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import type { Appointment } from "@/lib/workshop/types";
import { usePeople } from "@/components/workshop/hooks";
import {
  Empty,
  Initials,
  LicensePlateBadge,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/workshop/ui";
import { RepairedCarModal } from "@/components/workshop/repaired-car-modal";

export const Route = createFileRoute("/_authenticated/_admin/admin/vehicles")({
  head: () => ({ meta: [{ title: "Vehicle Registry — TorqueWorks" }] }),
  component: Vehicles,
});

function Vehicles() {
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const { names, phones } = usePeople();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // A vehicle is identified by its license plate; latest appointment wins for display.
  const vehicles = useMemo(() => {
    const m = new Map<string, typeof data>();
    for (const a of data) m.set(a.license_plate, [...(m.get(a.license_plate) ?? []), a]);
    return [...m.entries()].map(([plate, list]) => ({
      plate,
      latest: list[0]!,
      visits: list.length,
      total: list.reduce((s, a) => s + Number(a.cost ?? 0), 0),
    }));
  }, [data]);

  return (
    <>
      <PageHeader eyebrow="Fleet Management · Registered Fleet" title="VEHICLE" accent="REGISTRY" />
      <Panel
        flush
        title="All Serviced Automobiles (Click to view repair details)"
        meta={
          <span className="font-mono text-xs font-bold text-primary">
            {vehicles.length} distinct vehicles
          </span>
        }
      >
        {isLoading ? (
          <Empty>Loading vehicle database…</Empty>
        ) : vehicles.length === 0 ? (
          <Empty>No vehicles registered in system yet.</Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {vehicles.map(({ plate, latest: a, visits, total }) => {
              const mechanicName =
                (a.worker_id ? names.get(a.worker_id) : undefined) ||
                a.worker_notes ||
                "TorqueWorks Mechanic";

              return (
                <div
                  key={plate}
                  onClick={() => setSelectedAppointment(a)}
                  className="group flex cursor-pointer flex-wrap items-center gap-4 px-6 py-4.5 hover:bg-secondary/35 transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedAppointment(a);
                    }
                  }}
                >
                  <Initials text={`${a.vehicle_make} ${a.vehicle_model}`} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}
                      </p>
                      <LicensePlateBadge plate={plate} />
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      Driver: {a.first_name} {a.last_name}
                      {phones.get(a.customer_id) ? ` · ${phones.get(a.customer_id)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {visits} {visits === 1 ? "service visit" : "service visits"}
                    </span>
                    <span className="font-mono text-sm font-black text-foreground">
                      {money(total)}
                    </span>
                    <StatusBadge status={a.status} />
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Repaired Car Details Modal */}
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
      />
    </>
  );
}

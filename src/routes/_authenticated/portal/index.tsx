import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Car, ChevronRight, Clock, Plus, Wrench } from "lucide-react";
import { appointmentsQuery } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import type { Appointment } from "@/lib/workshop/types";
import {
  Empty,
  Initials,
  KpiStrip,
  LicensePlateBadge,
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
  fmtDate,
} from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { RepairedCarModal } from "@/components/workshop/repaired-car-modal";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({ meta: [{ title: "My Vehicles & Garage — TorqueWorks" }] }),
  component: Portal,
});

function Portal() {
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const active = data.filter((a) => a.status === "confirmed" || a.status === "in_repair").length;
  const due = data
    .filter((a) => a.status === "completed" && a.payment_status === "unpaid")
    .reduce((s, a) => s + Number(a.cost ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Customer Garage · Fleet Overview" title="MY" accent="VEHICLES">
        <Button
          asChild
          className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <Link to="/portal/book">
            <Plus className="size-4 mr-1.5" />
            Book New Service
          </Link>
        </Button>
      </PageHeader>

      <KpiStrip
        items={[
          { label: "Total Bookings", value: data.length },
          { label: "Awaiting Review", value: data.filter((a) => a.status === "pending").length },
          {
            label: "Active In Workshop",
            value: active,
            hot: active > 0,
            sub: active ? "On the repair floor now" : "No vehicles currently in bay",
          },
          { label: "Outstanding Balance", value: money(due), hot: due > 0 },
        ]}
      />

      <Panel
        title="Vehicle Service History & Active Jobs (Click for details)"
        flush
        meta={<span className="font-mono text-xs text-muted-foreground">{data.length} records</span>}
      >
        {isLoading ? (
          <Empty>Retrieving garage records…</Empty>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-border bg-secondary/30 text-primary">
              <Car className="size-6" />
            </div>
            <p className="font-mono text-sm font-semibold text-foreground">No vehicles registered yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Book your first diagnostic or maintenance slot.</p>
            <Button asChild size="sm" className="mt-4 bg-primary text-primary-foreground font-bold">
              <Link to="/portal/book">Book a service now</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {data.map((a) => {
              const isCompleted = a.status === "completed";
              const mechanicName = a.worker_notes || "TorqueWorks Master Mechanic";

              return (
                <div
                  key={a.id}
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

                  <div className="min-w-[220px] flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}
                      </p>
                      <LicensePlateBadge plate={a.license_plate} />
                    </div>

                    <p className="line-clamp-1 font-mono text-xs text-muted-foreground">
                      Issue: “{a.problem_description}”
                    </p>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        Booked {fmtDate(a.created_at)}
                      </span>
                      {a.scheduled_at && (
                        <span className="flex items-center gap-1 text-primary/90 font-medium">
                          <Calendar className="size-3" />
                          Bay Slot: {fmtDate(a.scheduled_at)}
                        </span>
                      )}
                      {/* Show mechanic who repaired */}
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          <Wrench className="size-3" />
                          Repaired by: {mechanicName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-mono text-base font-black text-foreground">
                      {a.cost != null ? money(Number(a.cost)) : "Est. pending"}
                    </p>
                    <PaymentBadge status={a.payment_status} />
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pl-2">
                    <StatusBadge status={a.status} />
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Repaired / Serviced Car Details Modal */}
      <RepairedCarModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(o) => !o && setSelectedAppointment(null)}
        mechanicName={selectedAppointment?.worker_notes || "TorqueWorks Master Mechanic"}
        isStaff={false}
      />
    </>
  );
}

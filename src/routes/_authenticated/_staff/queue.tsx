import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, ChevronRight, Clock, Eye, Phone, Sparkles } from "lucide-react";
import { appointmentsQuery } from "@/lib/workshop/api";
import type { Appointment } from "@/lib/workshop/types";
import { usePeople } from "@/components/workshop/hooks";
import {
  Empty,
  Initials,
  LicensePlateBadge,
  PageHeader,
  Panel,
  StatusBadge,
  fmtDate,
} from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { OrderDetailsModal } from "@/components/workshop/order-details-modal";

export const Route = createFileRoute("/_authenticated/_staff/queue")({
  head: () => ({ meta: [{ title: "Incoming Queue — TorqueWorks" }] }),
  component: Queue,
});

function Queue() {
  const { user } = Route.useRouteContext();
  const { names, phones } = usePeople();
  const { data = [], isLoading } = useQuery(appointmentsQuery());
  const pending = data.filter((a) => a.status === "pending");
  const upcoming = data
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Workshop Floor · Intake Stream"
        title="INCOMING"
        accent="QUEUE"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {pending.length} pending review · {upcoming.length} confirmed
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Incoming Customer Requests"
          flush
          meta={
            <div className="flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase text-amber-400">
                {pending.length} Awaiting Decision
              </span>
            </div>
          }
        >
          {isLoading ? (
            <Empty>Loading intake queue…</Empty>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-border bg-secondary/30 text-emerald-400">
                <Sparkles className="size-5" />
              </div>
              <p className="font-mono text-sm font-semibold text-foreground">Intake queue is clear</p>
              <p className="mt-1 text-xs text-muted-foreground">All customer booking requests have been reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {pending.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAppointment(a)}
                  className="group relative flex cursor-pointer flex-wrap items-center gap-4 px-6 py-4.5 transition-all duration-200 hover:bg-secondary/40"
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

                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">
                        {a.first_name} {a.last_name}
                      </p>
                      <span className="text-muted-foreground text-xs">•</span>
                      <p className="font-semibold text-xs text-foreground/90">
                        {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}
                      </p>
                      <LicensePlateBadge plate={a.license_plate} />
                    </div>

                    {/* Customer's Problem Description Highlight */}
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <p className="line-clamp-2 font-mono text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        <span className="text-primary font-semibold mr-1">“</span>
                        {a.problem_description}
                        <span className="text-primary font-semibold ml-1">”</span>
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        Requested {fmtDate(a.created_at)}
                      </span>
                      {phones.get(a.customer_id) && (
                        <span className="flex items-center gap-1 text-primary/90 font-medium">
                          <Phone className="size-3" />
                          {phones.get(a.customer_id)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-sm group-hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(a);
                      }}
                    >
                      <Eye className="size-3.5 mr-1.5" />
                      View Order & Decide
                    </Button>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Scheduled sidebar */}
        <Panel
          title="Confirmed Schedule"
          flush
          meta={<span className="font-mono text-xs text-muted-foreground">{upcoming.length} upcoming</span>}
        >
          {upcoming.length === 0 ? (
            <Empty>Nothing scheduled on the floor.</Empty>
          ) : (
            <div className="divide-y divide-border/60">
              {upcoming.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAppointment(a)}
                  className="group flex cursor-pointer items-center justify-between gap-3 px-6 py-3.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                        {a.vehicle_year} {a.vehicle_make} {a.vehicle_model}
                      </p>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground truncate">
                      {a.first_name} {a.last_name} · {a.license_plate}
                    </p>
                    <p className="flex items-center gap-1 font-mono text-[11px] text-primary/90 mt-0.5">
                      <Calendar className="size-3" />
                      {fmtDate(a.scheduled_at)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Order Details Modal opened when clicking on incoming queue */}
      <OrderDetailsModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        currentUserId={user.id}
        workerName={names.get(user.id) || (user.user_metadata?.full_name as string)}
        customerPhone={selectedAppointment ? phones.get(selectedAppointment.customer_id) : null}
      />
    </>
  );
}

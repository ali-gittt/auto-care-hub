import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appointmentsQuery } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import { usePeople } from "@/components/workshop/hooks";
import {
  Empty,
  Initials,
  LicensePlateBadge,
  PageHeader,
  Panel,
} from "@/components/workshop/ui";

export const Route = createFileRoute("/_authenticated/_admin/admin/customers")({
  head: () => ({ meta: [{ title: "Customer Directory — TorqueWorks" }] }),
  component: Customers,
});

function Customers() {
  const { profiles, roleOf } = usePeople();
  const { data = [] } = useQuery(appointmentsQuery());
  const customers = profiles.filter((p) => roleOf.get(p.id) === "customer");

  return (
    <>
      <PageHeader eyebrow="Administration · Client Directory" title="CUSTOMER" accent="ROSTER" />
      <Panel
        flush
        title="Registered Vehicle Owners"
        meta={
          <span className="font-mono text-xs font-bold text-primary">
            {customers.length} registered clients
          </span>
        }
      >
        {customers.length === 0 ? (
          <Empty>No customer accounts found.</Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {customers.map((c) => {
              const mine = data.filter((a) => a.customer_id === c.id);
              const spent = mine
                .filter((a) => a.payment_status === "paid")
                .reduce((s, a) => s + Number(a.cost ?? 0), 0);
              const plates = [...new Set(mine.map((a) => a.license_plate))];
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-4.5 hover:bg-secondary/30 transition-colors"
                >
                  <Initials text={c.full_name || c.email || ""} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {c.full_name || "Anonymous Owner"}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">{c.email}</p>
                    {plates.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase">
                          Vehicles:
                        </span>
                        {plates.map((pl) => (
                          <LicensePlateBadge key={pl} plate={pl} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {mine.length} {mine.length === 1 ? "booking" : "bookings"}
                    </span>
                    <span className="font-mono text-sm font-black text-foreground">
                      {money(spent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appointmentsQuery } from "@/lib/workshop/api";
import { money } from "@/lib/workshop/stats";
import { usePeople } from "@/components/workshop/hooks";
import { Empty, Initials, PageHeader, Panel } from "@/components/workshop/ui";

export const Route = createFileRoute("/_authenticated/_admin/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — TorqueWorks" }] }),
  component: Customers,
});

function Customers() {
  const { profiles, roleOf } = usePeople();
  const { data = [] } = useQuery(appointmentsQuery());
  const customers = profiles.filter((p) => roleOf.get(p.id) === "customer");

  return (
    <>
      <PageHeader eyebrow="Admin · People" title="CUSTOMER" accent="BOOK" />
      <Panel flush title="All customers" meta={<span className="eyebrow">{customers.length} total</span>}>
        {customers.length === 0 ? <Empty>No customers yet.</Empty> : (
          <div className="divide-y divide-border">
            {customers.map((c) => {
              const mine = data.filter((a) => a.customer_id === c.id);
              const spent = mine.filter((a) => a.payment_status === "paid").reduce((s, a) => s + Number(a.cost ?? 0), 0);
              const plates = [...new Set(mine.map((a) => a.license_plate))];
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <Initials text={c.full_name || c.email || ""} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold">{c.full_name || "—"}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{c.email}{plates.length ? ` · ${plates.join(", ")}` : ""}</p>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{mine.length} visits</span>
                  <span className="font-black">{money(spent)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}

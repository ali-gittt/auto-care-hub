import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/workshop/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TorqueWorks — Car repair workshop" },
      { name: "description", content: "Book a repair, track your vehicle's status and costs, and run the workshop floor in one place." },
      { property: "og:title", content: "TorqueWorks — Car repair workshop" },
      { property: "og:description", content: "Book a repair, track your vehicle's status and costs, and run the workshop floor in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  ["01", "Book", "Tell us your vehicle and what's wrong."],
  ["02", "Confirmed", "A mechanic accepts and picks your slot."],
  ["03", "In repair", "Follow progress and costs live."],
  ["04", "Completed", "Pick up, pay, drive off."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <div className="h-1 w-full bg-primary" />
      <nav className="mx-auto flex max-w-[1400px] items-center px-6 py-4">
        <Logo />
        <Button asChild variant="outline" className="ml-auto"><Link to="/auth">Sign in</Link></Button>
      </nav>
      <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-16">
        <p className="eyebrow mb-4 text-[11px] tracking-[0.22em] text-primary">Workshop · Est. service</p>
        <h1 className="max-w-4xl text-6xl font-black uppercase leading-[0.9] tracking-tighter sm:text-8xl">
          Repairs at <span className="text-primary">full torque.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Book a service in a minute, then watch your car move from confirmed to completed — with every cost in plain sight.
        </p>
        <Button asChild size="lg" className="mt-8"><Link to="/auth">Book a service</Link></Button>
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
          {steps.map(([n, t, d], i) => (
            <div key={n} className="kin bg-card p-6" style={{ animationDelay: `${i * 70}ms` }}>
              <p className="font-mono text-[11px] text-primary">{n}</p>
              <p className="mt-2 text-2xl font-black uppercase tracking-tight">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

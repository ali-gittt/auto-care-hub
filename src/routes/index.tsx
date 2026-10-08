import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/workshop/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TorqueWorks — Performance Auto Repair & Workshop" },
      {
        name: "description",
        content:
          "Book a repair, track your vehicle's live status and costs, and run the workshop floor in one place with zero guesswork.",
      },
      { property: "og:title", content: "TorqueWorks — Precision Car Repair Workshop" },
      {
        property: "og:description",
        content:
          "Book a repair, track your vehicle's live status and costs, and run the workshop floor in one place.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

const steps = [
  {
    num: "01",
    title: "Request & Intake",
    desc: "Describe your vehicle symptoms and submit your service request in under 60 seconds.",
    icon: Calendar,
  },
  {
    num: "02",
    title: "Technician Review",
    desc: "A master mechanic inspects your order details and schedules your dedicated repair bay.",
    icon: Wrench,
  },
  {
    num: "03",
    title: "Live Repair Telemetry",
    desc: "Track real-time progress on your dashboard with every part cost in plain sight.",
    icon: Gauge,
  },
  {
    num: "04",
    title: "Quality Check & Handover",
    desc: "Rigorous final inspection, settled invoice, and key return. Drive away with confidence.",
    icon: CheckCircle2,
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Transparent Fixed Pricing",
    desc: "Never be surprised by an invoice. Every labour hour and replacement part is visible before and during work.",
  },
  {
    icon: Award,
    title: "Certified Master Technicians",
    desc: "Our mechanics bring decades of automotive engineering expertise across modern performance and everyday vehicles.",
  },
  {
    icon: Clock,
    title: "Rapid Bay Turnaround",
    desc: "Streamlined digital intake and scheduling eliminates idle shop time, getting your vehicle back on the tarmac faster.",
  },
  {
    icon: Sparkles,
    title: "OEM & Grade-A Parts",
    desc: "We exclusively install manufacturer-certified and OEM-specification components backed by a 24-month warranty.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Brand Header Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-amber-400 to-primary/80" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border-border/80">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shadow-primary/20">
              <Link to="/auth">Book a Service</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/10 blur-[130px]" />

          <div className="mx-auto max-w-[1400px] px-6">
            <div className="max-w-4xl space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span>Next-Gen Workshop Floor & Booking Platform</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl font-black uppercase tracking-tight leading-[0.92] sm:text-7xl lg:text-8xl">
                Repairs at <br />
                <span className="bg-gradient-to-r from-primary via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  Full Torque.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl font-normal leading-relaxed">
                Book in a minute, watch your car move from pending review to confirmed bay slot, and monitor live progress with crystal clear pricing.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground font-black uppercase tracking-wider hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 px-8"
                >
                  <Link to="/auth">
                    Book Service Now <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-border/80 bg-secondary/30 hover:bg-secondary/70 h-12 px-6 font-semibold"
                >
                  <Link to="/auth">Track Existing Vehicle</Link>
                </Button>
              </div>

              {/* Workshop Ticker */}
              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-border/70 pt-8 sm:grid-cols-4">
                <div>
                  <p className="font-mono text-2xl font-black text-foreground sm:text-3xl">99.4%</p>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">Customer Satisfaction</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-black text-foreground sm:text-3xl">&lt; 3h</p>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">Average Bay Turnaround</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-black text-primary sm:text-3xl">24 Mo</p>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">Parts & Labor Warranty</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-black text-foreground sm:text-3xl">100%</p>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">Digital Price Transparency</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Lifecycle */}
        <section className="border-y border-border/70 bg-secondary/15 py-20">
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="mb-12">
              <p className="eyebrow text-primary">Process Architecture</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
                How Your Service Works
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((st, i) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.num}
                    className="kin group relative overflow-hidden rounded-xl border border-border/80 bg-card/90 p-6 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-primary">{st.num}</span>
                      <div className="grid size-9 place-items-center rounded-lg border border-border/80 bg-secondary/40 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-foreground">
                      {st.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Workshop Features */}
        <section className="py-20">
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="mb-12">
              <p className="eyebrow text-primary">Engineered For Reliability</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Why Drivers Choose TorqueWorks
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex items-start gap-4 rounded-xl border border-border/70 bg-card/60 p-6 transition-all hover:border-border hover:bg-card"
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                        {f.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pre-footer Call to Action */}
        <section className="border-t border-border/70 bg-gradient-to-b from-card/80 to-background py-16">
          <div className="mx-auto max-w-[1400px] px-6 text-center">
            <div className="mx-auto max-w-2xl space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Ready to Experience <span className="text-primary">Next-Gen Repair</span>?
              </h2>
              <p className="text-muted-foreground">
                Join hundreds of drivers who trust our mechanics for transparent, precision vehicle servicing.
              </p>
              <div className="pt-4">
                <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/25">
                  <Link to="/auth">Book Your Appointment Today</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-background/90 py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} TorqueWorks Auto Care. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

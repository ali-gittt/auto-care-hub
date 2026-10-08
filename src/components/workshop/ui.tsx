import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, PAYMENT_LABEL, type AppointmentStatus, type PaymentStatus } from "@/lib/workshop/types";

export function PageHeader({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2 text-[11px] tracking-[0.22em] text-primary">{eyebrow}</p>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl">
          {title} {accent && <span className="text-primary">{accent}</span>}
        </h1>
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, meta, children, className, flush }: { title?: string; meta?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("rounded-md border border-border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          {meta}
        </div>
      )}
      <div className={flush ? "" : "p-6"}>{children}</div>
    </section>
  );
}

export function KpiStrip({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; hot?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
      {items.map((k, i) => (
        <div key={k.label} className="kin bg-card p-5" style={{ animationDelay: `${i * 50}ms` }}>
          <p className="eyebrow">{k.label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{k.value}</p>
          {k.sub && <p className={cn("mt-1 text-[11px] font-semibold", k.hot ? "text-primary" : "text-muted-foreground")}>{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

const statusStyle: Record<AppointmentStatus, string> = {
  pending: "bg-muted-foreground/15 text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive line-through",
  confirmed: "bg-foreground/10 text-foreground",
  in_repair: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn("shrink-0 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-wider", statusStyle[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = status === "paid" ? "text-success" : status === "refunded" ? "text-warning" : "text-muted-foreground";
  return <span className={cn("font-mono text-[10px] uppercase tracking-wider", s)}>{PAYMENT_LABEL[status]}</span>;
}

export function Bar({ value, max, strong }: { value: number; max: number; strong?: boolean }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-border">
      <div className={cn("h-full rounded-full", strong ? "bg-primary" : "bg-primary/60")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Initials({ text }: { text: string }) {
  const i = text.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <div className="grid size-11 shrink-0 place-items-center rounded-md bg-border text-sm font-black">{i || "?"}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-6 py-10 text-center font-mono text-xs text-muted-foreground">{children}</p>;
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

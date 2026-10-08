import type { ReactNode } from "react";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, PAYMENT_LABEL, type AppointmentStatus, type PaymentStatus } from "@/lib/workshop/types";

export function PageHeader({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-5">
      <div>
        <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.2em] text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono uppercase">{eyebrow}</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {title} {accent && <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">{accent}</span>}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  meta,
  children,
  className,
  flush,
}: {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border/70 bg-secondary/30 px-6 py-4">
          <h2 className="text-base font-black uppercase tracking-wider text-foreground sm:text-lg">{title}</h2>
          {meta}
        </div>
      )}
      <div className={flush ? "" : "p-6"}>{children}</div>
    </section>
  );
}

export function KpiStrip({
  items,
}: {
  items: { label: string; value: ReactNode; sub?: ReactNode; hot?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k, i) => (
        <div
          key={k.label}
          className="kin relative overflow-hidden rounded-xl border border-border/70 bg-card/90 p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {k.hot && (
            <div className="absolute right-0 top-0 h-16 w-16 overflow-hidden">
              <div className="absolute -right-6 top-2 h-2 w-20 rotate-45 bg-primary/70" />
            </div>
          )}
          <p className="eyebrow text-muted-foreground">{k.label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">{k.value}</p>
          {k.sub && (
            <p className={cn("mt-1.5 text-xs font-semibold", k.hot ? "text-primary" : "text-muted-foreground")}>
              {k.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const statusConfig: Record<AppointmentStatus, { bg: string; dot: string; text: string }> = {
  pending: {
    bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    dot: "bg-amber-400 animate-pulse",
    text: "Pending",
  },
  rejected: {
    bg: "bg-destructive/10 border-destructive/30 text-destructive line-through",
    dot: "bg-destructive",
    text: "Rejected",
  },
  confirmed: {
    bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    dot: "bg-blue-400",
    text: "Confirmed",
  },
  in_repair: {
    bg: "bg-primary/15 border-primary/40 text-primary",
    dot: "bg-primary animate-ping",
    text: "In Repair",
  },
  completed: {
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    dot: "bg-emerald-400",
    text: "Completed",
  },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const conf = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider",
        conf.bg
      )}
    >
      <span className={cn("size-1.5 rounded-full", conf.dot)} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const isPaid = status === "paid";
  const isRef = status === "refunded";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        isPaid
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : isRef
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
      )}
    >
      {PAYMENT_LABEL[status]}
    </span>
  );
}

export function LicensePlateBadge({ plate }: { plate: string }) {
  return (
    <span className="inline-flex items-center overflow-hidden rounded border border-neutral-700 bg-neutral-900 shadow-inner">
      <span className="flex items-center justify-center bg-blue-700 px-1 py-0.5 text-[8px] font-black text-white">
        EU
      </span>
      <span className="px-2 py-0.5 font-mono text-xs font-black tracking-widest text-amber-300">
        {plate.toUpperCase()}
      </span>
    </span>
  );
}

export function Bar({ value, max, strong }: { value: number; max: number; strong?: boolean }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          strong ? "bg-gradient-to-r from-primary to-amber-500" : "bg-primary/70"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Initials({ text }: { text: string }) {
  const i = text.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-border/70 bg-gradient-to-br from-secondary to-card text-xs font-black text-foreground shadow-inner">
      {i || "?"}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full border border-border/80 bg-secondary/30 text-muted-foreground">
        <Wrench className="size-5" />
      </div>
      <p className="font-mono text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";


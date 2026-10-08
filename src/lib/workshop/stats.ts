import type { Appointment } from "./types";

export type RangePreset = "today" | "week" | "month" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

/** Resolve a preset into an inclusive [from, to] range. Weeks start on Monday. */
export function resolveRange(preset: RangePreset, now = new Date(), custom?: DateRange): DateRange {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  switch (preset) {
    case "today":
      return { from: start, to: end };
    case "week": {
      const dow = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - dow);
      return { from: start, to: end };
    }
    case "month":
      start.setDate(1);
      return { from: start, to: end };
    case "year":
      start.setMonth(0, 1);
      return { from: start, to: end };
    case "custom": {
      if (!custom) return { from: start, to: end };
      const f = new Date(custom.from);
      f.setHours(0, 0, 0, 0);
      const t = new Date(custom.to);
      t.setHours(23, 59, 59, 999);
      return { from: f, to: t };
    }
  }
}

const inRange = (iso: string | null, r: DateRange) => {
  if (!iso) return false;
  const d = new Date(iso).getTime();
  return d >= r.from.getTime() && d <= r.to.getTime();
};

const PROBLEM_KEYWORDS: [string, RegExp][] = [
  ["Brakes", /brake|pad|rotor/i],
  ["Engine / check light", /engine|check|idle|misfire/i],
  ["Oil service", /oil|filter/i],
  ["A/C & cooling", /a\/c|air con|coolant|overheat|radiator/i],
  ["Electrical & battery", /battery|electric|light|start/i],
  ["Tyres & suspension", /tyre|tire|suspension|alignment|shock/i],
  ["Clutch & gearbox", /clutch|gear|transmission/i],
];

export function categorizeProblem(text: string): string {
  for (const [label, re] of PROBLEM_KEYWORDS) if (re.test(text)) return label;
  return "Other";
}

export interface WorkerStat {
  workerId: string;
  completed: number;
  active: number;
  revenue: number;
  avgHours: number;
}

export interface WorkshopStats {
  appointments: number;
  pending: number;
  rejected: number;
  activeRepairs: number;
  completedRepairs: number;
  repairs: number;
  revenue: number;
  avgCost: number;
  avgDurationHours: number;
  commonProblems: { label: string; count: number }[];
  workers: WorkerStat[];
}

export function computeStats(rows: Appointment[], range: DateRange): WorkshopStats {
  const created = rows.filter((a) => inRange(a.created_at, range));
  const completed = rows.filter((a) => a.status === "completed" && inRange(a.completed_at, range));
  const active = rows.filter((a) => a.status === "confirmed" || a.status === "in_repair");
  const paid = completed.filter((a) => a.payment_status === "paid");
  const revenue = paid.reduce((s, a) => s + Number(a.cost ?? 0), 0);
  const costed = completed.filter((a) => a.cost != null);
  const avgCost = costed.length ? costed.reduce((s, a) => s + Number(a.cost), 0) / costed.length : 0;
  const durations = completed
    .filter((a) => a.started_at && a.completed_at)
    .map((a) => (new Date(a.completed_at!).getTime() - new Date(a.started_at!).getTime()) / 3_600_000);
  const avgDurationHours = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;

  const problems = new Map<string, number>();
  for (const a of created) {
    const k = categorizeProblem(a.problem_description);
    problems.set(k, (problems.get(k) ?? 0) + 1);
  }

  const workers = new Map<string, WorkerStat & { hours: number[] }>();
  const w = (id: string) => {
    if (!workers.has(id)) workers.set(id, { workerId: id, completed: 0, active: 0, revenue: 0, avgHours: 0, hours: [] });
    return workers.get(id)!;
  };
  for (const a of completed) {
    if (!a.worker_id) continue;
    const s = w(a.worker_id);
    s.completed++;
    if (a.payment_status === "paid") s.revenue += Number(a.cost ?? 0);
    if (a.started_at && a.completed_at)
      s.hours.push((new Date(a.completed_at).getTime() - new Date(a.started_at).getTime()) / 3_600_000);
  }
  for (const a of active) if (a.worker_id) w(a.worker_id).active++;

  return {
    appointments: created.length,
    pending: created.filter((a) => a.status === "pending").length,
    rejected: created.filter((a) => a.status === "rejected").length,
    activeRepairs: active.length,
    completedRepairs: completed.length,
    repairs: active.length + completed.length,
    revenue,
    avgCost,
    avgDurationHours,
    commonProblems: [...problems.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    workers: [...workers.values()]
      .map(({ hours, ...s }) => ({ ...s, avgHours: hours.length ? hours.reduce((x, y) => x + y, 0) / hours.length : 0 }))
      .sort((a, b) => b.completed - a.completed),
  };
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const duration = (hours: number) => (hours >= 24 ? `${(hours / 24).toFixed(1)}d` : `${hours.toFixed(1)}h`);

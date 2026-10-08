import { describe, expect, it } from "vitest";
import { computeStats, resolveRange } from "./stats";
import { primaryRole, homeFor } from "./roles";
import { NEXT_STATUS } from "./types";
import type { Appointment } from "./types";

const base: Appointment = {
  id: "x", customer_id: "c", first_name: "A", last_name: "B", vehicle_make: "VW", vehicle_model: "Golf",
  vehicle_year: 2019, license_plate: "AB1", problem_description: "brake noise", status: "pending",
  scheduled_at: null, worker_id: null, cost: null, payment_status: "unpaid", worker_notes: null,
  started_at: null, completed_at: null, created_at: "2026-10-08T09:00:00Z", updated_at: "2026-10-08T09:00:00Z",
};

describe("workshop rules", () => {
  it("status pipeline is Confirmed → In Repair → Completed", () => {
    expect(NEXT_STATUS.confirmed).toBe("in_repair");
    expect(NEXT_STATUS.in_repair).toBe("completed");
    expect(NEXT_STATUS.completed).toBeUndefined();
  });

  it("admin outranks worker; homes differ per role", () => {
    expect(primaryRole(["worker", "admin"])).toBe("admin");
    expect(homeFor("customer")).toBe("/portal");
    expect(homeFor("worker")).toBe("/queue");
  });

  it("week range starts on Monday", () => {
    const r = resolveRange("week", new Date(2026, 9, 8, 12)); // Thu
    expect(r.from.getDate()).toBe(5);
  });

  it("revenue counts only paid completed repairs; rejected counted", () => {
    const range = { from: new Date("2026-10-01"), to: new Date("2026-10-31") };
    const rows: Appointment[] = [
      { ...base, id: "1", status: "completed", cost: 200, payment_status: "paid", worker_id: "w",
        started_at: "2026-10-08T10:00:00Z", completed_at: "2026-10-08T14:00:00Z" },
      { ...base, id: "2", status: "completed", cost: 100, payment_status: "unpaid", worker_id: "w",
        started_at: "2026-10-08T10:00:00Z", completed_at: "2026-10-08T12:00:00Z" },
      { ...base, id: "3", status: "rejected" },
    ];
    const s = computeStats(rows, range);
    expect(s.revenue).toBe(200);
    expect(s.avgCost).toBe(150);
    expect(s.avgDurationHours).toBe(3);
    expect(s.rejected).toBe(1);
    expect(s.workers[0]?.completed).toBe(2);
  });
});

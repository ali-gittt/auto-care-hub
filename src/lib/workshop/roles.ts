import type { AppRole } from "./types";

export type NavItem = { to: string; label: string };

/** Primary role decides the home dashboard; admin outranks worker outranks customer. */
export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("worker")) return "worker";
  return "customer";
}

export const isStaff = (roles: AppRole[]) => roles.includes("admin") || roles.includes("worker");

export function homeFor(role: AppRole): string {
  return role === "admin" ? "/admin" : role === "worker" ? "/queue" : "/portal";
}

export function navFor(role: AppRole): NavItem[] {
  const worker: NavItem[] = [
    { to: "/queue", label: "Incoming" },
    { to: "/repairs", label: "Repairs" },
    { to: "/ai-diagnosis", label: "AI Diagnosis" },
    { to: "/dtc-scanner", label: "DTC Scanner" },
  ];
  if (role === "customer")
    return [
      { to: "/portal", label: "My vehicles" },
      { to: "/portal/book", label: "Book service" },
    ];
  if (role === "worker") return worker;
  return [
    { to: "/admin", label: "Dashboard" },
    ...worker,
    { to: "/admin/customers", label: "Customers" },
    { to: "/admin/vehicles", label: "Vehicles" },
    { to: "/admin/workers", label: "Workers" },
    { to: "/admin/prices", label: "Prices" },
  ];
}

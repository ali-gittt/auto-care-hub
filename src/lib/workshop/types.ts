import type { Database } from "@/integrations/supabase/types";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pending",
  rejected: "Rejected",
  confirmed: "Confirmed",
  in_repair: "In Repair",
  completed: "Completed",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
};

/** Repair pipeline: the only forward transitions a worker may make. */
export const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  confirmed: "in_repair",
  in_repair: "completed",
};

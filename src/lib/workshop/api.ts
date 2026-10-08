import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, AppointmentInsert, Appointment, Service } from "./types";

const unwrap = <T,>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data as T;
};

export async function fetchMyRoles(userId: string): Promise<AppRole[]> {
  const rows = unwrap(await supabase.from("user_roles").select("role").eq("user_id", userId));
  return rows.map((r) => r.role);
}

/** RLS scopes this to the caller: customers get their own, staff get all. */
export const appointmentsQuery = () =>
  queryOptions({
    queryKey: ["appointments"],
    queryFn: async () =>
      unwrap(await supabase.from("appointments").select("*").order("created_at", { ascending: false })),
  });

export const servicesQuery = () =>
  queryOptions({
    queryKey: ["services"],
    queryFn: async () => unwrap(await supabase.from("services").select("*").order("name")),
  });

export const profilesQuery = () =>
  queryOptions({
    queryKey: ["profiles"],
    queryFn: async () => unwrap(await supabase.from("profiles").select("*").order("created_at")),
  });

export const rolesQuery = () =>
  queryOptions({
    queryKey: ["roles"],
    queryFn: async () => unwrap(await supabase.from("user_roles").select("user_id, role")),
  });

export async function createAppointment(input: Omit<AppointmentInsert, "customer_id" | "status">) {
  return unwrap(await supabase.from("appointments").insert(input).select().single());
}

export async function updateAppointment(id: string, patch: Partial<Appointment>) {
  return unwrap(await supabase.from("appointments").update(patch).eq("id", id).select().single());
}

export async function upsertService(s: Partial<Service> & { name: string; price: number }) {
  if (s.id) return unwrap(await supabase.from("services").update(s).eq("id", s.id).select().single());
  return unwrap(await supabase.from("services").insert(s).select().single());
}

export async function deleteService(id: string) {
  unwrap(await supabase.from("services").delete().eq("id", id));
}

export async function setRole(userId: string, role: AppRole) {
  unwrap(await supabase.from("user_roles").delete().eq("user_id", userId));
  unwrap(await supabase.from("user_roles").insert({ user_id: userId, role }));
}

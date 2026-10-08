import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createAppointment } from "@/lib/workshop/api";
import { PageHeader, Panel } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/portal/book")({
  head: () => ({ meta: [{ title: "Book a service — TorqueWorks" }] }),
  component: Book,
});

const fields = [
  ["first_name", "First name"],
  ["last_name", "Last name"],
  ["vehicle_make", "Vehicle make"],
  ["vehicle_model", "Vehicle model"],
  ["vehicle_year", "Vehicle year"],
  ["license_plate", "License plate"],
] as const;

function Book() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: () =>
      createAppointment({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        vehicle_make: form.vehicle_make.trim(),
        vehicle_model: form.vehicle_model.trim(),
        vehicle_year: Number(form.vehicle_year),
        license_plate: form.license_plate.trim().toUpperCase(),
        problem_description: form.problem_description.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment requested — we'll confirm a time soon.");
      navigate({ to: "/portal" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const y = Number(form.vehicle_year);
    if (!y || y < 1950 || y > new Date().getFullYear() + 1) return toast.error("Enter a valid vehicle year");
    m.mutate();
  }

  return (
    <>
      <PageHeader eyebrow="Customer · New request" title="BOOK" accent="SERVICE" />
      <Panel title="Vehicle & problem" className="max-w-3xl">
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          {fields.map(([k, label]) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={k} className="eyebrow">{label}</Label>
              <Input
                id={k}
                required
                maxLength={60}
                type={k === "vehicle_year" ? "number" : "text"}
                value={form[k] ?? ""}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pd" className="eyebrow">Problem description</Label>
            <Textarea id="pd" required maxLength={1000} rows={5} value={form.problem_description ?? ""}
              onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
              placeholder="e.g. Squealing noise when braking at low speed" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={m.isPending}>{m.isPending ? "Sending…" : "Request appointment"}</Button>
          </div>
        </form>
      </Panel>
    </>
  );
}

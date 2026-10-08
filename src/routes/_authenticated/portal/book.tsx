import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, Calendar, Car, CheckCircle2, Phone, ShieldCheck, Wrench } from "lucide-react";
import { createAppointment } from "@/lib/workshop/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/portal/book")({
  head: () => ({ meta: [{ title: "Book a Repair Service — TorqueWorks" }] }),
  component: Book,
});

function Book() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: String(new Date().getFullYear()),
    license_plate: "",
    problem_description: "",
  });

  // Pre-fill profile info if already available
  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const parts = (data.full_name || "").split(/\s+/);
          setForm((prev) => ({
            ...prev,
            first_name: prev.first_name || parts[0] || "",
            last_name: prev.last_name || parts.slice(1).join(" ") || "",
            phone: prev.phone || data.phone || "",
          }));
        }
      });
  }, [user.id]);

  const m = useMutation({
    mutationFn: async () => {
      // 1. Sync phone number and full name to customer profile
      if (form.phone.trim()) {
        await supabase
          .from("profiles")
          .update({
            phone: form.phone.trim(),
            full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
          })
          .eq("id", user.id);
        qc.invalidateQueries({ queryKey: ["profiles"] });
      }

      // 2. Create the appointment request
      return createAppointment({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        vehicle_make: form.vehicle_make.trim(),
        vehicle_model: form.vehicle_model.trim(),
        vehicle_year: Number(form.vehicle_year),
        license_plate: form.license_plate.trim().toUpperCase(),
        problem_description: form.problem_description.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment request sent! Our technicians will review and confirm your slot.");
      navigate({ to: "/portal" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const y = Number(form.vehicle_year);
    if (!y || y < 1950 || y > new Date().getFullYear() + 1) {
      toast.error("Please enter a valid vehicle manufacturing year (1950 - present)");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Please enter a contact phone number so our mechanics can reach you.");
      return;
    }
    m.mutate();
  }

  return (
    <>
      <PageHeader
        eyebrow="Customer Service Intake · Reservation"
        title="BOOK"
        accent="SERVICE"
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form area */}
        <div className="lg:col-span-8">
          <Panel title="Vehicle Specifications & Reported Issue">
            <form onSubmit={submit} className="space-y-6">
              {/* Owner info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    1. Driver / Vehicle Owner Information
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fn" className="eyebrow">First Name</Label>
                    <Input
                      id="fn"
                      required
                      maxLength={60}
                      placeholder="e.g. John"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln" className="eyebrow">Last Name</Label>
                    <Input
                      id="ln"
                      required
                      maxLength={60}
                      placeholder="e.g. Doe"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="ph" className="eyebrow flex items-center gap-1.5">
                      <Phone className="size-3 text-primary" /> Contact Phone Number
                    </Label>
                    <Input
                      id="ph"
                      required
                      type="tel"
                      placeholder="e.g. +1 (555) 234-5678 or 06 12 34 56 78"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="bg-background font-mono"
                    />
                    <p className="font-mono text-[11px] text-muted-foreground">
                      Our mechanics will contact you at this number for bay readiness and vehicle collection.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    2. Vehicle Specifications
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="make" className="eyebrow">Vehicle Make</Label>
                    <Input
                      id="make"
                      required
                      maxLength={60}
                      placeholder="e.g. BMW, Audi, Toyota"
                      value={form.vehicle_make}
                      onChange={(e) => setForm({ ...form, vehicle_make: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="model" className="eyebrow">Vehicle Model</Label>
                    <Input
                      id="model"
                      required
                      maxLength={60}
                      placeholder="e.g. 330i, A4, Camry"
                      value={form.vehicle_model}
                      onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="year" className="eyebrow">Model Year</Label>
                    <Input
                      id="year"
                      required
                      type="number"
                      min={1950}
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g. 2021"
                      value={form.vehicle_year}
                      onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })}
                      className="bg-background font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plate" className="eyebrow">License Plate</Label>
                    <Input
                      id="plate"
                      required
                      maxLength={20}
                      placeholder="e.g. 7-XYZ-89"
                      value={form.license_plate}
                      onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })}
                      className="bg-background font-mono font-bold tracking-wider uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Problem description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    3. Problem Description & Symptoms
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">Max 1,000 chars</span>
                </div>
                <div className="space-y-1.5">
                  <Textarea
                    id="pd"
                    required
                    maxLength={1000}
                    rows={4}
                    value={form.problem_description}
                    onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                    placeholder="Describe any abnormal noises, warning lights, brake vibrations, or fluid leaks..."
                    className="bg-background leading-relaxed"
                  />
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Tip: Be as specific as possible (e.g. "Clunking sound over bumps on the front left side").
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={m.isPending}
                  className="bg-primary text-primary-foreground font-black uppercase tracking-wider hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 w-full sm:w-auto px-8"
                >
                  {m.isPending ? "Submitting Request…" : "Submit Intake Request"}
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-border/80 bg-card/90 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-5" />
              <h3 className="font-black uppercase text-sm tracking-wide text-foreground">
                Intake Guarantee
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once submitted, your request will appear on the workshop floor intake queue. Our technicians will examine the reported issue and schedule a bay slot.
            </p>

            <div className="space-y-2.5 pt-2 border-t border-border/60 font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>No upfront payment required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Live tracking on your dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>OEM parts & 24mo guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

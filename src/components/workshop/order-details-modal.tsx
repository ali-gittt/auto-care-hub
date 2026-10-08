import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Car,
  Clock,
  Phone,
  User,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { updateAppointment } from "@/lib/workshop/api";
import type { Appointment } from "@/lib/workshop/types";
import { LicensePlateBadge, StatusBadge, fmtDate } from "./ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderDetailsModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  workerName?: string;
  customerPhone?: string | null;
}

export function OrderDetailsModal({
  appointment,
  open,
  onOpenChange,
  currentUserId,
  workerName,
  customerPhone,
}: OrderDetailsModalProps) {
  const qc = useQueryClient();
  const [scheduledWhen, setScheduledWhen] = useState("");
  const [rejectConfirm, setRejectConfirm] = useState(false);

  const m = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Appointment> }) =>
      updateAppointment(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      onOpenChange(false);
      setRejectConfirm(false);
      setScheduledWhen("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!appointment) return null;

  const handleAccept = () => {
    if (!scheduledWhen) {
      toast.error("Please pick a scheduled date and time for the repair slot.");
      return;
    }

    m.mutate(
      {
        id: appointment.id,
        patch: {
          status: "confirmed",
          scheduled_at: new Date(scheduledWhen).toISOString(),
          worker_id: currentUserId,
          worker_notes: workerName || appointment.worker_notes,
        },
      },
      {
        onSuccess: () => {
          toast.success("Appointment accepted and repair slot confirmed!");
        },
      }
    );
  };

  const handleReject = () => {
    m.mutate(
      {
        id: appointment.id,
        patch: {
          status: "rejected",
          worker_id: currentUserId,
        },
      },
      {
        onSuccess: () => {
          toast.info("Appointment request declined.");
        },
      }
    );
  };

  // Helper quick shortcuts for scheduling
  const setQuickTime = (daysFromNow: number, hours: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => String(n).padStart(2, "0");
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduledWhen(localIso);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setRejectConfirm(false);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg border-border/80 bg-card/95 p-0 backdrop-blur-xl shadow-2xl sm:max-w-xl">
        {/* Header bar */}
        <div className="relative overflow-hidden rounded-t-lg border-b border-border/70 bg-secondary/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                  Order Details · Intake Review
                </span>
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
                {appointment.vehicle_year} {appointment.vehicle_make} {appointment.vehicle_model}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted-foreground">
                Submitted {fmtDate(appointment.created_at)}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge status={appointment.status} />
              <LicensePlateBadge plate={appointment.license_plate} />
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="max-h-[68vh] overflow-y-auto p-6 space-y-6">
          {/* Customer & Vehicle Snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="size-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase font-semibold">Customer</span>
              </div>
              <p className="font-bold text-sm text-foreground">
                {appointment.first_name} {appointment.last_name}
              </p>
              {customerPhone ? (
                <a
                  href={`tel:${customerPhone}`}
                  className="mt-1 flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                >
                  <Phone className="size-3" />
                  <span>{customerPhone}</span>
                </a>
              ) : (
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  Phone on profile
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Car className="size-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase font-semibold">Vehicle</span>
              </div>
              <p className="font-bold text-sm text-foreground truncate">
                {appointment.vehicle_year} {appointment.vehicle_make} {appointment.vehicle_model}
              </p>
            </div>
          </div>

          {/* Customer Problem Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Wrench className="size-3.5 text-primary" />
                Customer's Problem Description
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">Original intake notes</span>
            </div>
            <div className="rounded-xl border border-border/80 bg-neutral-950/60 p-4 shadow-inner">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                {appointment.problem_description || "No specific notes provided by customer."}
              </p>
            </div>
          </div>

          {/* Action section for worker/admin */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                Worker Decision & Scheduling
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              To accept this job, assign an appointment slot on the repair floor. Otherwise, you may decline the request.
            </p>

            <div className="space-y-2 pt-1">
              <Label htmlFor="scheduled-slot" className="font-mono text-[11px] font-semibold uppercase text-foreground">
                Select Service Date & Time
              </Label>
              <Input
                id="scheduled-slot"
                type="datetime-local"
                value={scheduledWhen}
                onChange={(e) => setScheduledWhen(e.target.value)}
                className="bg-card font-mono text-sm border-border focus:border-primary"
              />

              {/* Quick slots shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-mono text-[10px] text-muted-foreground mr-1">Quick slots:</span>
                <button
                  type="button"
                  onClick={() => setQuickTime(1, 9)}
                  className="rounded border border-border/80 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Tomorrow 09:00
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTime(1, 14)}
                  className="rounded border border-border/80 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Tomorrow 14:00
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTime(2, 10)}
                  className="rounded border border-border/80 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  In 2 days 10:00
                </button>
              </div>
            </div>
          </div>

          {/* Decline confirmation warning */}
          {rejectConfirm && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <div className="flex-1">
                Are you sure you want to decline this request? The customer will see that their appointment was not accepted.
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="flex-col gap-2 border-t border-border/70 bg-secondary/20 p-4 sm:flex-row sm:justify-between sm:gap-0">
          <div>
            {!rejectConfirm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto"
                onClick={() => setRejectConfirm(true)}
                disabled={m.isPending}
              >
                <XCircle className="size-4 mr-1.5" />
                Decline Request
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={m.isPending}
                >
                  Yes, Decline
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRejectConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={m.isPending}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shadow-primary/20"
              onClick={handleAccept}
              disabled={m.isPending}
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              {m.isPending ? "Confirming…" : "Accept & Confirm Slot"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

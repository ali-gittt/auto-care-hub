import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Phone,
  ShieldCheck,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import type { Appointment, PaymentStatus } from "@/lib/workshop/types";
import { LicensePlateBadge, StatusBadge, fmtDate } from "./ui";
import { money } from "@/lib/workshop/stats";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepairedCarModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanicName?: string;
  customerPhone?: string | null;
  isStaff?: boolean;
  onTogglePayment?: (newStatus: PaymentStatus) => void;
  busy?: boolean;
}

export function RepairedCarModal({
  appointment,
  open,
  onOpenChange,
  mechanicName,
  customerPhone,
  isStaff,
  onTogglePayment,
  busy,
}: RepairedCarModalProps) {
  if (!appointment) return null;

  const isPaid = appointment.payment_status === "paid";
  const isRefunded = appointment.payment_status === "refunded";
  const costNumber = Number(appointment.cost ?? 0);
  const resolvedMechanic =
    mechanicName ||
    appointment.worker_notes ||
    "TorqueWorks Master Mechanic";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/80 bg-card/95 p-0 backdrop-blur-xl shadow-2xl sm:max-w-xl">
        {/* Header with car badge */}
        <div className="relative overflow-hidden rounded-t-lg border-b border-border/70 bg-secondary/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wrench className="size-3.5 text-primary" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                  Repaired Vehicle Record
                </span>
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
                {appointment.vehicle_year} {appointment.vehicle_make} {appointment.vehicle_model}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted-foreground">
                Service ID: #{appointment.id.slice(0, 8).toUpperCase()}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge status={appointment.status} />
              <LicensePlateBadge plate={appointment.license_plate} />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* 1. HIGHLIGHTED MECHANIC ATTRIBUTION CARD */}
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-secondary/60 to-card p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Wrench className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                  <ShieldCheck className="size-3.5" />
                  <span>Certified Mechanic Attribution</span>
                </div>
                <p className="text-lg font-black tracking-tight text-foreground sm:text-xl truncate">
                  Repaired by : <span className="text-primary">{resolvedMechanic}</span>
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Master Automotive Guild Specialist
                </p>
              </div>
            </div>
          </div>

          {/* 2. PROMINENT PAYMENT STATUS BANNER (PAID OR NOT) */}
          <div
            className={cn(
              "rounded-xl border p-4.5 transition-all shadow-sm",
              isPaid
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : isRefunded
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg border",
                    isPaid
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                      : "border-destructive/40 bg-destructive/20 text-destructive"
                  )}
                >
                  {isPaid ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <AlertCircle className="size-5" />
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Status
                  </p>
                  <p className="text-base font-black uppercase tracking-tight">
                    {isPaid
                      ? "PAID IN FULL"
                      : isRefunded
                        ? "REFUNDED"
                        : "UNPAID — BALANCE DUE"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-[10px] text-muted-foreground uppercase">
                  Total Repair Cost
                </p>
                <p className="font-mono text-xl font-black text-foreground">
                  {costNumber > 0 ? money(costNumber) : "Pending Calculation"}
                </p>
              </div>
            </div>

            {/* Quick staff payment toggle */}
            {isStaff && onTogglePayment && (
              <div className="mt-3 flex items-center justify-between border-t border-current/20 pt-2.5">
                <span className="font-mono text-xs text-muted-foreground">
                  Update payment status:
                </span>
                <div className="flex items-center gap-2">
                  {!isPaid ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      onClick={() => onTogglePayment("paid")}
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Mark as Paid
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                      onClick={() => onTogglePayment("unpaid")}
                    >
                      <XCircle className="size-3.5 mr-1" />
                      Mark as Unpaid
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. VEHICLE & CUSTOMER DETAILS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-secondary/20 p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <User className="size-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase font-semibold">
                  Vehicle Owner
                </span>
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
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  Phone on profile
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-secondary/20 p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Car className="size-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase font-semibold">
                  Car Specifications
                </span>
              </div>
              <p className="font-bold text-sm text-foreground truncate">
                {appointment.vehicle_year} {appointment.vehicle_make} {appointment.vehicle_model}
              </p>
              <p className="mt-0.5 font-mono text-xs text-amber-300 font-bold">
                Plate: {appointment.license_plate}
              </p>
            </div>
          </div>

          {/* 4. WORK PERFORMED / PROBLEM DESCRIPTION */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase text-muted-foreground">
                Reported Issue & Service Performed
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Intake notes
              </span>
            </div>
            <div className="rounded-xl border border-border/80 bg-neutral-950/60 p-4 shadow-inner">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                {appointment.problem_description}
              </p>
            </div>
          </div>

          {/* 5. TIMESTAMPS */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>Requested: {fmtDate(appointment.created_at)}</span>
            </div>
            {appointment.scheduled_at && (
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-primary" />
                <span>Bay Slot: {fmtDate(appointment.scheduled_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border/70 bg-secondary/20 p-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Close Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, Shield, Wrench, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { navFor } from "@/lib/workshop/roles";
import type { AppRole } from "@/lib/workshop/types";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
      <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-amber-500 to-amber-600 shadow-md shadow-primary/25">
        <Wrench className="size-5 text-primary-foreground transition-transform group-hover:rotate-45 duration-300" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight leading-none text-foreground">
          TORQUE<span className="text-primary">WORKS</span>
        </span>
        <span className="font-mono text-[9px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          Auto Care & Performance
        </span>
      </div>
    </Link>
  );
}

const roleBadgeMap: Record<AppRole, { label: string; bg: string; icon: typeof Zap }> = {
  admin: {
    label: "ADMIN",
    bg: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    icon: Shield,
  },
  worker: {
    label: "MECHANIC",
    bg: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: Wrench,
  },
  customer: {
    label: "CLIENT",
    bg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: Zap,
  },
};

export function AppShell({
  role,
  name,
  children,
}: {
  role: AppRole;
  name: string;
  children: ReactNode;
}) {
  const nav = navFor(role);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const initials = name
    .split(/[\s@]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleInfo = roleBadgeMap[role] || roleBadgeMap.customer;
  const RoleIcon = roleInfo.icon;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = nav.map((n) => (
    <Link
      key={n.to}
      to={n.to}
      onClick={() => setOpen(false)}
      activeOptions={{ exact: true }}
      className="relative px-3 py-1.5 font-sans text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary/40 rounded-lg"
      activeProps={{
        className:
          "text-foreground font-bold bg-secondary/80 border border-border/80 shadow-inner after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-4 after:bg-primary after:rounded-full",
      }}
    >
      {n.label}
    </Link>
  ));

  return (
    <div className="min-h-screen">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-amber-400 to-primary/80" />

      {/* Main navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-3.5">
          <Logo />

          {/* Desktop links */}
          <div className="ml-4 hidden items-center gap-1.5 lg:flex">{links}</div>

          {/* Right side user info & actions */}
          <div className="ml-auto flex items-center gap-3">
            {/* Role indicator badge */}
            <div
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                roleInfo.bg
              )}
            >
              <RoleIcon className="size-3" />
              <span>{roleInfo.label}</span>
            </div>

            {/* User avatar & signout */}
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <div
                title={name}
                className="grid size-9 place-items-center rounded-xl border border-border/80 bg-gradient-to-br from-secondary to-card text-xs font-black text-foreground shadow-inner"
              >
                {initials || "ME"}
              </div>

              <button
                onClick={signOut}
                title="Sign out"
                className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="grid size-9 place-items-center rounded-lg border border-border/70 bg-secondary/30 lg:hidden text-foreground"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {open && (
          <div className="flex flex-col gap-2 border-t border-border/70 bg-card/95 px-6 py-5 lg:hidden">
            <div className="mb-2 flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs text-muted-foreground">{name}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                  roleInfo.bg
                )}
              >
                {roleInfo.label}
              </span>
            </div>
            {links}
            <button
              onClick={signOut}
              className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive text-left"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 sm:px-6 pb-20 pt-6">
        {children}
      </main>
    </div>
  );
}

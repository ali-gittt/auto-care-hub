import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { navFor } from "@/lib/workshop/roles";
import type { AppRole } from "@/lib/workshop/types";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 rotate-12 place-items-center bg-primary">
        <span className="-rotate-12 text-lg font-black text-primary-foreground">T</span>
      </span>
      <span className="text-xl font-black tracking-tight">
        TORQUE<span className="text-primary">WORKS</span>
      </span>
    </Link>
  );
}

export function AppShell({ role, name, children }: { role: AppRole; name: string; children: ReactNode }) {
  const nav = navFor(role);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const initials = name.split(/[\s@]+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

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
      className="text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "text-foreground" }}
    >
      {n.label}
    </Link>
  ));

  return (
    <div className="min-h-screen">
      <div className="h-1 w-full bg-primary" />
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-4">
          <Logo />
          <div className="ml-4 hidden items-center gap-6 text-sm font-semibold lg:flex">{links}</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="eyebrow hidden text-[11px] sm:inline">{role}</span>
            <button
              onClick={signOut}
              title="Sign out"
              className="grid size-9 place-items-center rounded-full bg-card text-[11px] font-bold outline-1 -outline-offset-1 outline-border hover:outline-primary"
            >
              {initials || "ME"}
            </button>
            <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <div className="flex flex-col gap-4 border-t border-border px-6 py-4 text-sm font-semibold lg:hidden">
            {links}
            <button onClick={signOut} className="text-left text-primary">Sign out</button>
          </div>
        )}
      </nav>
      <main className="mx-auto max-w-[1400px] space-y-6 px-6 pb-16 pt-8">{children}</main>
    </div>
  );
}

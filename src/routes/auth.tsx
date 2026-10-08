import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/workshop/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TorqueWorks" },
      { name: "description", content: "Sign in to book services and track your vehicle repairs." },
      { property: "og:title", content: "Sign in — TorqueWorks" },
      { property: "og:description", content: "Sign in to book services and track your vehicle repairs." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/dashboard" }));
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error, data } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password,
          options: { data: { full_name: f.name }, emailRedirectTo: `${window.location.origin}/dashboard` } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) navigate({ to: "/dashboard" });
    else toast.success("Check your email to confirm your account.");
  }

  return (
    <div className="min-h-screen">
      <div className="h-1 w-full bg-primary" />
      <div className="mx-auto grid min-h-[calc(100vh-4px)] max-w-md content-center gap-8 px-6">
        <Logo />
        <div>
          <p className="eyebrow mb-2 text-[11px] text-primary">{mode === "in" ? "Welcome back" : "New account"}</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter">{mode === "in" ? "Sign in" : "Create account"}</h1>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-md border border-border bg-card p-6">
          {mode === "up" && (
            <div className="space-y-1.5"><Label className="eyebrow" htmlFor="n">Full name</Label>
              <Input id="n" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          )}
          <div className="space-y-1.5"><Label className="eyebrow" htmlFor="e">Email</Label>
            <Input id="e" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="eyebrow" htmlFor="p">Password</Label>
            <Input id="p" type="password" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "No account? Create one →" : "Already have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}

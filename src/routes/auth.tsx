import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock, Mail, Shield, User, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/workshop/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In / Register — TorqueWorks" },
      { name: "description", content: "Sign in to book services and track your vehicle repairs live." },
      { property: "og:title", content: "Sign In — TorqueWorks Workshop" },
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
    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
        : await supabase.auth.signUp({
            email: f.email,
            password: f.password,
            options: {
              data: { full_name: f.name },
              emailRedirectTo: `${window.location.origin}/dashboard`,
            },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Account created! Please check your email to verify if needed.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-amber-400 to-primary/80" />

      {/* Main container */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 items-center justify-center p-6 md:p-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-12">
          {/* Left Hero & Value Props */}
          <div className="hidden space-y-8 lg:col-span-6 lg:block">
            <Logo />

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                <Shield className="size-3.5" />
                <span>Authorized Workshop Access</span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tight text-foreground xl:text-5xl">
                Precision Floor & <br />
                <span className="text-primary">Repair Tracking.</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Connect directly with our master technicians. Request bay slots, view itemized part estimates, and follow your repair pipeline in real time.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                "Instant intake queue review & confirmation",
                "Full live repair stage transparency",
                "Itemized costs with zero hidden shop fees",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-foreground/90">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/80 bg-card/95 p-8 shadow-2xl backdrop-blur-xl">
              <div className="lg:hidden mb-4">
                <Logo />
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-secondary/40 p-1">
                <button
                  type="button"
                  onClick={() => setMode("in")}
                  className={`rounded-lg py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    mode === "in"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("up")}
                  className={`rounded-lg py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    mode === "up"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  {mode === "in" ? "Welcome Back" : "Register Vehicle Owner"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {mode === "in"
                    ? "Enter your credentials to access your workshop garage."
                    : "Create an account to book your first repair service."}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "up" && (
                  <div className="space-y-1.5">
                    <Label className="eyebrow flex items-center gap-1.5" htmlFor="n">
                      <User className="size-3 text-primary" /> Full Name
                    </Label>
                    <Input
                      id="n"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={f.name}
                      onChange={(e) => setF({ ...f, name: e.target.value })}
                      className="bg-background border-border/80"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="eyebrow flex items-center gap-1.5" htmlFor="e">
                    <Mail className="size-3 text-primary" /> Email Address
                  </Label>
                  <Input
                    id="e"
                    type="email"
                    required
                    placeholder="driver@example.com"
                    value={f.email}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                    className="bg-background border-border/80"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="eyebrow flex items-center gap-1.5" htmlFor="p">
                    <Lock className="size-3 text-primary" /> Password
                  </Label>
                  <Input
                    id="p"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                    className="bg-background border-border/80"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider hover:bg-primary/90 shadow-md shadow-primary/20 h-11"
                  disabled={busy}
                >
                  {busy ? "Authenticating…" : mode === "in" ? "Sign In to Garage" : "Create Account"}
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  onClick={() => setMode(mode === "in" ? "up" : "in")}
                >
                  {mode === "in" ? "Don't have an account yet? Create one →" : "Already registered? Sign in instead →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimal */}
      <footer className="border-t border-border/70 py-4 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          TorqueWorks Workshop Portal · Secure Auth
        </p>
      </footer>
    </div>
  );
}

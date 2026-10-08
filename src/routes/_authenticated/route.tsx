import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/workshop/app-shell";
import { fetchMyRoles } from "@/lib/workshop/api";
import { primaryRole } from "@/lib/workshop/roles";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const roles = await fetchMyRoles(data.user.id);
    return { user: data.user, roles, role: primaryRole(roles) };
  },
  component: Layout,
});

function Layout() {
  const { user, role } = Route.useRouteContext();
  const name = (user.user_metadata?.["full_name"] as string) || user.email || "";
  return (
    <AppShell role={role} name={name}>
      <Outlet />
    </AppShell>
  );
}

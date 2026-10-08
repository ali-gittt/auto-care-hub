import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { homeFor } from "@/lib/workshop/roles";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: ({ context }) => {
    if (!context.roles.includes("admin")) throw redirect({ to: homeFor(context.role) });
  },
  component: () => <Outlet />,
});

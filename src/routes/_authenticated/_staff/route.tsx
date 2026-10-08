import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isStaff } from "@/lib/workshop/roles";

export const Route = createFileRoute("/_authenticated/_staff")({
  beforeLoad: ({ context }) => {
    if (!isStaff(context.roles)) throw redirect({ to: "/portal" });
  },
  component: () => <Outlet />,
});

import { createFileRoute, redirect } from "@tanstack/react-router";
import { homeFor } from "@/lib/workshop/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: ({ context }) => {
    throw redirect({ to: homeFor(context.role) });
  },
});

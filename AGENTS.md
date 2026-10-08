<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Data access uses the browser Supabase client with RLS (src/lib/workshop/api.ts); RLS is the real permission boundary, route guards are UX only.
- Roles live in public.user_roles; one role per user, set by admins; first signup becomes admin via trigger — avoids a bootstrap step.
- Role → nav/home mapping lives in src/lib/workshop/roles.ts so adding a role/page is one edit.
- Statistics are computed client-side by pure functions in src/lib/workshop/stats.ts (unit-tested) — easy to move server-side later.
- Appointment and repair are one row (appointments table) moving through status; vehicles are derived from license plates.
- AI features (diagnosis, cost prediction) are intentionally absent; they will be added externally later.

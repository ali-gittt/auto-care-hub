create type public.app_role as enum ('admin','worker','customer');
create type public.appointment_status as enum ('pending','rejected','confirmed','in_repair','completed');
create type public.payment_status as enum ('unpaid','paid','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','worker'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "read roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "admin add roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin remove roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'customer');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  est_hours numeric(6,2) not null default 1,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "everyone reads services" on public.services for select to authenticated using (true);
create policy "admin manages services" on public.services for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.services (name, price, est_hours) values
 ('Oil & filter service', 89, 1), ('Brake pads replacement', 220, 2), ('Diagnostics / check engine', 75, 1),
 ('A/C recharge', 140, 1.5), ('Clutch replacement', 850, 6), ('Tyre change & alignment', 120, 1.5);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid(),
  first_name text not null,
  last_name text not null,
  vehicle_make text not null,
  vehicle_model text not null,
  vehicle_year int not null,
  license_plate text not null,
  problem_description text not null,
  status public.appointment_status not null default 'pending',
  scheduled_at timestamptz,
  worker_id uuid,
  cost numeric(10,2),
  payment_status public.payment_status not null default 'unpaid',
  worker_notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "customer reads own" on public.appointments for select to authenticated using (customer_id = auth.uid() or public.is_staff(auth.uid()));
create policy "customer creates own" on public.appointments for insert to authenticated with check (customer_id = auth.uid() and status = 'pending');
create policy "staff updates" on public.appointments for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "admin deletes" on public.appointments for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.appointments_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  if new.status = 'in_repair' and old.status <> 'in_repair' and new.started_at is null then new.started_at = now(); end if;
  if new.status = 'completed' and old.status <> 'completed' then new.completed_at = now(); end if;
  return new;
end; $$;
create trigger appointments_touch before update on public.appointments for each row execute function public.appointments_touch();
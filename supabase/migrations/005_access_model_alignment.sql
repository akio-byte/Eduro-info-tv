-- V1 hardening: align access model for settings and profiles.
-- Intent:
-- 1) display_settings is writable by admins only.
-- 2) profiles policies are explicit and non-recursive.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role = 'admin'
  );
$$;

-- display_settings: everyone can read, only admin can write
alter table public.display_settings enable row level security;

drop policy if exists "Public read access for display_settings" on public.display_settings;
create policy "Public read access for display_settings"
  on public.display_settings
  for select
  using (true);

drop policy if exists "Authenticated write access for display_settings" on public.display_settings;
drop policy if exists "Admin write access for display_settings" on public.display_settings;
create policy "Admin write access for display_settings"
  on public.display_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: explicit read/write model
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Admin write access for profiles" on public.profiles;
drop policy if exists "Admin full access for profiles" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can manage profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

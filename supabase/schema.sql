-- Eduro InfoTV Supabase Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text not null check (role in ('admin', 'editor')) default 'editor',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Announcements
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  priority text not null check (priority in ('high', 'normal', 'low')) default 'normal',
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  is_published boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Events
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  location text,
  is_published boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Highlights
create table if not exists public.highlights (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  body text,
  image_url text,
  image_path text,
  cta_label text,
  cta_url text,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  is_published boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. QR Links
create table if not exists public.qr_links (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  url text not null,
  description text,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  is_published boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Display Settings
create table if not exists public.display_settings (
  id uuid default '00000000-0000-0000-0000-000000000001'::uuid primary key,
  org_name text not null default 'Eduro',
  welcome_text text,
  rotation_interval_seconds integer not null default 15,
  show_announcements boolean default true not null,
  show_events boolean default true not null,
  show_highlights boolean default true not null,
  show_qr_links boolean default true not null,
  show_opening_hours boolean default true not null,
  opening_hours_text text,
  fallback_message text,
  accent_color text not null default '#0ea5e9',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.display_settings
  alter column id set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table public.display_settings
  drop constraint if exists display_settings_singleton_id_check;

alter table public.display_settings
  add constraint display_settings_singleton_id_check
  check (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Insert default settings
insert into public.display_settings (
  id,
  org_name,
  welcome_text,
  rotation_interval_seconds,
  opening_hours_text,
  fallback_message,
  accent_color
)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Eduro',
  'Tervetuloa Eduroon!',
  15,
  'Ma-Pe 08:00 - 16:00',
  'Ei uusia tiedotteita tällä hetkellä. Mukavaa päivää!',
  '#0ea5e9'
)
on conflict (id) do update set
  org_name = excluded.org_name,
  welcome_text = excluded.welcome_text,
  rotation_interval_seconds = excluded.rotation_interval_seconds,
  opening_hours_text = excluded.opening_hours_text,
  fallback_message = excluded.fallback_message,
  accent_color = excluded.accent_color;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.highlights enable row level security;
alter table public.qr_links enable row level security;
alter table public.display_settings enable row level security;

-- Drop existing policies if any (for clean re-runs)
drop policy if exists "Public read access for announcements" on public.announcements;
drop policy if exists "Public read access for events" on public.events;
drop policy if exists "Public read access for highlights" on public.highlights;
drop policy if exists "Public read access for qr_links" on public.qr_links;
drop policy if exists "Public read access for display_settings" on public.display_settings;
drop policy if exists "Auth read access for announcements" on public.announcements;
drop policy if exists "Auth read access for events" on public.events;
drop policy if exists "Auth read access for highlights" on public.highlights;
drop policy if exists "Auth read access for qr_links" on public.qr_links;
drop policy if exists "Editor write access for announcements" on public.announcements;
drop policy if exists "Editor write access for events" on public.events;
drop policy if exists "Editor write access for highlights" on public.highlights;
drop policy if exists "Editor write access for qr_links" on public.qr_links;
drop policy if exists "Admin write access for display_settings" on public.display_settings;
drop policy if exists "Admin write access for profiles" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Public read access for highlight images" on storage.objects;
drop policy if exists "Editor write access for highlight images" on storage.objects;
drop policy if exists "Editor update access for highlight images" on storage.objects;
drop policy if exists "Editor delete access for highlight images" on storage.objects;

-- Public read access for display (only published and active content)
create policy "Public read access for announcements" on public.announcements for select using (
  is_published = true and
  (start_at is null or start_at <= now()) and
  (end_at is null or end_at >= now())
);

create policy "Public read access for events" on public.events for select using (
  is_published = true and
  event_date >= current_date
);

create policy "Public read access for highlights" on public.highlights for select using (
  is_published = true and
  (start_at is null or start_at <= now()) and
  (end_at is null or end_at >= now())
);

create policy "Public read access for qr_links" on public.qr_links for select using (
  is_published = true and
  (start_at is null or start_at <= now()) and
  (end_at is null or end_at >= now())
);

create policy "Public read access for display_settings" on public.display_settings for select using (true);

-- Authenticated read access (editors/admins can see everything in admin panel)
create policy "Auth read access for announcements" on public.announcements for select to authenticated using (true);
create policy "Auth read access for events" on public.events for select to authenticated using (true);
create policy "Auth read access for highlights" on public.highlights for select to authenticated using (true);
create policy "Auth read access for qr_links" on public.qr_links for select to authenticated using (true);

-- Editor/Admin write access for content
create policy "Editor write access for announcements" on public.announcements for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);

create policy "Editor write access for events" on public.events for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);

create policy "Editor write access for highlights" on public.highlights for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);

create policy "Editor write access for qr_links" on public.qr_links for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);

-- Admin ONLY write access for settings and profiles
create policy "Admin write access for display_settings" on public.display_settings for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Admin write access for profiles" on public.profiles for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can read own profile" on public.profiles for select to authenticated using (
  id = auth.uid()
);

-- Triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_updated_at on public.announcements;
drop trigger if exists handle_updated_at on public.events;
drop trigger if exists handle_updated_at on public.highlights;
drop trigger if exists handle_updated_at on public.qr_links;
drop trigger if exists handle_updated_at on public.display_settings;

create trigger handle_updated_at before update on public.announcements for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.events for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.highlights for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.qr_links for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.display_settings for each row execute procedure public.handle_updated_at();

-- Trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'editor');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Storage
insert into storage.buckets (id, name, public)
values ('infotv-highlights', 'infotv-highlights', true)
on conflict (id) do nothing;

create policy "Public read access for highlight images"
  on storage.objects for select
  using (bucket_id = 'infotv-highlights');

create policy "Editor write access for highlight images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'infotv-highlights' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Editor update access for highlight images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'infotv-highlights' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Editor delete access for highlight images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'infotv-highlights' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

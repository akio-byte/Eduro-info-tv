-- Migration 001: Jobs module + video support for highlights
-- Apply this to your Supabase project via the SQL editor or CLI.

-- 1. Add video_url to highlights (non-breaking, nullable)
alter table public.highlights
  add column if not exists video_url text;

-- 2. Add show_jobs toggle to display_settings
alter table public.display_settings
  add column if not exists show_jobs boolean default false not null;

-- 3. Jobs table
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  department text,
  location text,
  description text,
  apply_url text,
  is_published boolean default true not null,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RLS for jobs
alter table public.jobs enable row level security;

drop policy if exists "Public read access for jobs" on public.jobs;
create policy "Public read access for jobs" on public.jobs for select using (
  is_published = true and
  (start_at is null or start_at <= now()) and
  (end_at is null or end_at >= now())
);

drop policy if exists "Auth read access for jobs" on public.jobs;
create policy "Auth read access for jobs" on public.jobs for select to authenticated using (true);

drop policy if exists "Editor write access for jobs" on public.jobs;
create policy "Editor write access for jobs" on public.jobs for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);

-- 5. updated_at trigger for jobs
drop trigger if exists handle_updated_at on public.jobs;
create trigger handle_updated_at before update on public.jobs
  for each row execute procedure public.handle_updated_at();

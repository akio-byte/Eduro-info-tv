-- V1 release hardening
-- Aligns RLS with the v1 operating model, enforces singleton settings,
-- and keeps pinned announcements deterministic.

do $$
declare
  settings_singleton_id constant uuid := '00000000-0000-0000-0000-000000000001';
  canonical_id uuid;
begin
  -- Keep only one display settings row and migrate it to the singleton ID.
  select id
    into canonical_id
    from public.display_settings
   where id = settings_singleton_id
   limit 1;

  if canonical_id is null then
    select id
      into canonical_id
      from public.display_settings
     order by updated_at desc nulls last, id
     limit 1;

    if canonical_id is not null then
      update public.display_settings
         set id = settings_singleton_id
       where id = canonical_id;
    end if;
  end if;

  delete from public.display_settings
   where id <> settings_singleton_id;

  insert into public.display_settings (
    id,
    org_name,
    welcome_text,
    rotation_interval_seconds,
    show_announcements,
    show_events,
    show_highlights,
    show_qr_links,
    show_opening_hours,
    show_jobs,
    show_rss,
    opening_hours_text,
    opening_hours_mon_fri,
    opening_hours_sat,
    opening_hours_sun,
    rss_feed_url,
    rss_max_items,
    fallback_message,
    accent_color
  )
  values (
    settings_singleton_id,
    'Eduro',
    'Tervetuloa Eduroon!',
    15,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    'Ma-Pe 08:00 - 16:00',
    'Ma–Pe 8:00–16:00',
    'La suljettu',
    'Su suljettu',
    null,
    3,
    'Ei uusia tiedotteita tällä hetkellä. Mukavaa päivää!',
    '#0ea5e9'
  )
  on conflict (id) do nothing;
end
$$;

alter table public.display_settings
  alter column id set default '00000000-0000-0000-0000-000000000001'::uuid,
  alter column show_rss set default false,
  alter column rss_max_items set default 3;

update public.display_settings
   set show_rss = false
 where show_rss is null;

update public.display_settings
   set rss_max_items = 3
 where rss_max_items is null;

alter table public.display_settings
  alter column show_rss set not null,
  alter column rss_max_items set not null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'display_settings_singleton_id'
       and conrelid = 'public.display_settings'::regclass
  ) then
    alter table public.display_settings
      add constraint display_settings_singleton_id
      check (id = '00000000-0000-0000-0000-000000000001'::uuid);
  end if;
end
$$;

drop policy if exists "Admin write access for display_settings" on public.display_settings;
drop policy if exists "Authenticated write access for display_settings" on public.display_settings;

create policy "Authenticated write access for display_settings"
  on public.display_settings
  for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.ensure_single_pinned_announcement()
returns trigger as $$
begin
  if new.is_pinned then
    update public.announcements
       set is_pinned = false
     where is_pinned = true
       and id <> new.id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists ensure_single_pinned_announcement on public.announcements;

create trigger ensure_single_pinned_announcement
  before insert or update of is_pinned
  on public.announcements
  for each row
  execute procedure public.ensure_single_pinned_announcement();

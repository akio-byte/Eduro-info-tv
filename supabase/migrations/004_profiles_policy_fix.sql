-- Fix recursive profiles RLS policy.
-- The old "FOR ALL" admin policy queried public.profiles inside its own policy
-- and caused infinite recursion for authenticated profile reads.

drop policy if exists "Admin write access for profiles" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;

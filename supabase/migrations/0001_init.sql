-- Sadhana tracker: initial schema
-- Run in the Supabase SQL editor or via supabase db push.

-- ===== roles (kept on their own table, never on profiles) =====
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ===== daily entries: one row per user per date =====
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  day_of_week text not null,
  bed_time time,
  bed_time_score smallint not null default 0,
  wake_up_time time,
  wake_up_score smallint not null default 0,
  japa_completion_time time,
  japa_score smallint not null default 0,
  japa_rounds smallint not null default 16,
  mangala_arati boolean not null default false,
  tulasi_arati boolean not null default false,
  darshan_arati boolean not null default false,
  guru_puja boolean not null default false,
  bhagavatam_class boolean not null default false,
  deity_darshan boolean not null default false,
  sloka_memorisation boolean not null default false,
  yoga boolean not null default false,
  book_distribution boolean not null default false,
  bd_hours numeric(4,1) not null default 0,
  instrument_practice boolean not null default false,
  gaura_arati boolean not null default false,
  sp_books_minutes smallint not null default 0,
  sp_lectures_minutes smallint not null default 0,
  guru_maharaja_minutes smallint not null default 0,
  rsp_lectures_minutes smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ===== per-user settings =====
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wizard_mode boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ===== grants =====
grant usage on schema public to anon, authenticated;
grant all on public.daily_entries to authenticated;
grant all on public.user_settings to authenticated;
grant select on public.user_roles to authenticated;

-- ===== row level security =====
alter table public.daily_entries enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_roles enable row level security;

create policy "Users manage their own entries"
  on public.daily_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins read all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_entries_touch before update on public.daily_entries
  for each row execute function public.touch_updated_at();
create trigger user_settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();

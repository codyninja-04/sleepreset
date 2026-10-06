-- SleepReset initial schema
-- One row per night with the habits from the day before it, saved
-- correlation analyses, tonight's suggestion and wind-down push devices.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, created by trigger on sign up
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  display_name text,
  timezone text not null default 'Asia/Singapore',
  plan text not null default 'free' check (plan in ('free', 'pro')),
  target_bedtime time not null default '23:30',
  wind_down_minutes smallint not null default 45 check (wind_down_minutes between 15 and 120),
  reminder_enabled boolean not null default false,
  last_reminded_on date
);

-- ---------------------------------------------------------------------------
-- Sleep logs
-- sleep_date is the evening the night started. The habits on the same row
-- are from that day, so each row reads "what I did, then how I slept".
-- ---------------------------------------------------------------------------
create table sleep_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sleep_date date not null,
  bedtime time,
  wake_time time,
  sleep_quality integer check (sleep_quality between 1 and 5),
  times_woken integer default 0 check (times_woken between 0 and 30),
  -- Daily habits (logged same day)
  caffeine_after_2pm boolean default false,
  screen_time_before_bed_minutes integer check (screen_time_before_bed_minutes between 0 and 720),
  exercised_today boolean default false,
  exercise_time text check (exercise_time in ('morning', 'afternoon', 'evening', 'none')),
  alcohol_consumed boolean default false,
  stress_level integer check (stress_level between 1 and 5),
  nap_taken boolean default false,
  nap_duration_minutes integer check (nap_duration_minutes between 0 and 300),
  notes text check (char_length(notes) <= 500),
  unique(user_id, sleep_date)
);

-- ---------------------------------------------------------------------------
-- Correlation analyses, one row per generation
-- ---------------------------------------------------------------------------
create table sleep_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz default now(),
  based_on_days integer,
  correlations jsonb not null,             -- [{ factor, correlation_strength, description, ...stats }]
  top_recommendation text,
  source text not null default 'ai' check (source in ('ai', 'rules'))
);

-- ---------------------------------------------------------------------------
-- Tonight's suggestion, cached so the page and the push say the same thing
-- ---------------------------------------------------------------------------
create table tonight_coaching (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  for_date date not null,
  headline text not null,
  detail text not null,
  source text not null default 'ai' check (source in ('ai', 'rules')),
  unique(user_id, for_date)
);

-- ---------------------------------------------------------------------------
-- Web Push subscriptions, one per device
-- ---------------------------------------------------------------------------
create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

-- Indexes
create index idx_sleep_logs_user on sleep_logs(user_id, sleep_date desc);
create index idx_insights_user on sleep_insights(user_id, generated_at desc);
create index idx_tonight_user on tonight_coaching(user_id, for_date desc);
create index idx_push_user on push_subscriptions(user_id);
create index idx_profiles_reminders on profiles(reminder_enabled) where reminder_enabled;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sleep_logs_updated_at before update on sleep_logs
  for each row execute function set_updated_at();
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Users cannot upgrade themselves by writing to their own profile
create or replace function protect_plan() returns trigger
language plpgsql as $$
begin
  if new.plan is distinct from old.plan and coalesce(auth.role(), '') <> 'service_role' then
    new.plan = old.plan;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_plan before update on profiles
  for each row execute function protect_plan();

-- Profile row on sign up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table sleep_logs enable row level security;
alter table sleep_insights enable row level security;
alter table tonight_coaching enable row level security;
alter table push_subscriptions enable row level security;

create policy "own_profile_select" on profiles for select using (auth.uid() = id);
create policy "own_profile_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_sleep_logs" on sleep_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_insights" on sleep_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_tonight" on tonight_coaching for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_push" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CAP (Courses A Pied) schema
-- Run this in the Supabase SQL editor (or via `supabase db push` if you use the CLI).

create extension if not exists "pgcrypto";

create table if not exists "CAP_races" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  race_date date not null,
  distance_label text,
  elevation_gain_m integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table "CAP_races" add column if not exists elevation_gain_m integer;
alter table "CAP_races" add column if not exists notes text;
alter table "CAP_races" add column if not exists result_time text;
alter table "CAP_races" add column if not exists result_rank text;
alter table "CAP_races" add column if not exists result_feeling smallint;
alter table "CAP_races" add column if not exists result_notes text;
alter table "CAP_races" add column if not exists ai_report text;
alter table "CAP_races" add column if not exists ai_report_generated_at timestamptz;

create table if not exists "CAP_profile" (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  full_name text,
  photo_data_url text,
  level text,
  terrain_access text[] not null default '{}',
  objective text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table "CAP_profile" add column if not exists bio text;
alter table "CAP_profile" add column if not exists weight_kg numeric;
alter table "CAP_profile" add column if not exists height_cm numeric;
alter table "CAP_profile" add column if not exists strength_access text[] not null default '{}';
alter table "CAP_profile" add column if not exists secondary_objective text;
alter table "CAP_profile" add column if not exists secondary_objective_date date;

create table if not exists "CAP_workouts" (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references "CAP_races"(id) on delete cascade,
  workout_date date not null,
  title text,
  notes text,
  distance_km numeric,
  duration_min integer,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (race_id, workout_date)
);

create index if not exists "CAP_workouts_race_id_idx" on "CAP_workouts" (race_id);

-- Actual performance logged when a planned session is marked done (the
-- "flip card" result entry) — separate from the plan (title/distance_km/
-- duration_min/notes above) so prévu vs réalisé stays comparable.
alter table "CAP_workouts" add column if not exists actual_distance_km numeric;
alter table "CAP_workouts" add column if not exists actual_duration_min numeric;
alter table "CAP_workouts" add column if not exists actual_avg_heart_rate integer;
alter table "CAP_workouts" add column if not exists actual_elevation_gain_m integer;
alter table "CAP_workouts" add column if not exists actual_notes text;

-- Manual training history (e.g. copied over from Garmin) — gives the AI
-- verifiable proof of current fitness even with zero races completed
-- inside the app yet.
create table if not exists "CAP_activities" (
  id uuid primary key default gen_random_uuid(),
  activity_date date not null,
  title text,
  distance_km numeric,
  duration_min numeric,
  avg_heart_rate integer,
  elevation_gain_m integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists "CAP_activities_date_idx" on "CAP_activities" (activity_date);

-- Row Level Security is left disabled on purpose: this app is a single-user
-- tool gated by an application-level password (see src/lib/auth.ts) and
-- talks to Supabase with the service role key from the server only.
-- If you ever expose the anon key to the browser, enable RLS and add policies.

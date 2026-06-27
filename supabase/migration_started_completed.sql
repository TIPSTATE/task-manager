-- Migración para bases de datos existentes
-- Ejecuta en Supabase → SQL Editor si ya tenías la tabla tasks con due_date/due_time

alter table public.tasks
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.tasks
  drop column if exists due_date,
  drop column if exists due_time;

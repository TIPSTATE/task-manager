-- Migración: tabla de horas de comida
-- Ejecuta en Supabase → SQL Editor → Run

create table if not exists public.lunch_breaks (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.lunch_breaks enable row level security;

drop policy if exists "Permitir lectura de comidas" on public.lunch_breaks;
create policy "Permitir lectura de comidas"
  on public.lunch_breaks for select using (true);

drop policy if exists "Permitir crear comidas" on public.lunch_breaks;
create policy "Permitir crear comidas"
  on public.lunch_breaks for insert with check (true);

-- Realtime (ignora error si ya estaba agregada)
do $$
begin
  alter publication supabase_realtime add table public.lunch_breaks;
exception
  when duplicate_object then null;
end $$;

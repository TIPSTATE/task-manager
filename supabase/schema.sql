-- Ejecuta este script en Supabase → SQL Editor

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  priority text not null default 'media',
  due_date date not null,
  due_time text not null default '12:00',
  assigned_to text not null,
  empresa text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Permitir lectura de tareas"
  on public.tasks
  for select
  using (true);

create policy "Permitir crear tareas"
  on public.tasks
  for insert
  with check (true);

create policy "Permitir actualizar tareas"
  on public.tasks
  for update
  using (true)
  with check (true);

create policy "Permitir eliminar tareas"
  on public.tasks
  for delete
  using (true);

-- Habilita Realtime para sincronización en vivo
alter publication supabase_realtime add table public.tasks;

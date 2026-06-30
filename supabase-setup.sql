-- ============================================================
-- PSH Cooking Contest — Setup de Supabase
-- Corré TODO esto una vez en: Supabase → SQL Editor → New query → Run
-- Es seguro correrlo de nuevo: no duplica platos ni rompe nada.
-- ============================================================

-- 1) Configuración del concurso (una sola fila)
create table if not exists config (
  id               int primary key default 1,
  contest_name     text    not null default 'PSH Cooking Contest',
  points_per_voter int     not null default 10,
  max_per_dish     int     not null default 3,
  voting_open      boolean not null default true,
  constraint single_row check (id = 1)
);
insert into config (id) values (1) on conflict (id) do nothing;

-- 2) Platos (el cocinero es anónimo: solo guardamos el nombre del plato)
create table if not exists dishes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- 3) Votos: un voto por persona (voter_id) y por plato
create table if not exists votes (
  voter_id   text not null,
  dish_id    uuid not null references dishes(id) on delete cascade,
  points     int  not null check (points >= 0),
  updated_at timestamptz not null default now(),
  primary key (voter_id, dish_id)
);

-- 4) Platos precargados (solo si la tabla está vacía)
insert into dishes (name)
select v.name
from (values
  ('Sanguchitos de miga'),
  ('Knishes de papa (1)'),
  ('Knishes de papa (2)'),
  ('Milanesas'),
  ('Torta bizcochuelo con dulce de leche'),
  ('Fosforitos de jamón y queso'),
  ('Fainá (1)'),
  ('Fainá (2)'),
  ('Empanada salteña'),
  ('Empanadas de carne'),
  ('Empanadas'),
  ('Alfajores de maicena'),
  ('Alfajorcitos de maicena (1)'),
  ('Alfajorcitos de maicena (2)'),
  ('Pastafrola'),
  ('Chipa y pastafrola'),
  ('Chipa (con Ary)'),
  ('Sanguchitos de milanesa'),
  ('Pastita de pollo con ajo (dip)'),
  ('Mini pastelitos de papa'),
  ('Pastelitos'),
  ('Guiso de lentejas'),
  ('Humita')
) as v(name)
where not exists (select 1 from dishes);

-- 5) Permisos: acceso público con la anon key (evento interno)
alter table config enable row level security;
alter table dishes enable row level security;
alter table votes  enable row level security;

drop policy if exists config_all on config;
drop policy if exists dishes_all on dishes;
drop policy if exists votes_all  on votes;

create policy config_all on config for all using (true) with check (true);
create policy dishes_all on dishes for all using (true) with check (true);
create policy votes_all  on votes  for all using (true) with check (true);

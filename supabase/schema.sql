-- Esquema do banco do Apadrinhamento, RECONSTRUÍDO a partir do código do front
-- (o banco original fica no Lovable Cloud e não foi acessado diretamente).
-- Use só se for migrar para um Supabase próprio. Confira tipos/defaults com o
-- original antes de importar dados de lá.

create table public.duplas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  padrinho text not null,
  afilhado text not null,
  ciclo integer not null default 1,
  data_inicio date not null default current_date,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'recuperacao', 'formado', 'encerrado')),
  reuniao1 date,
  reuniao2 date,
  reuniao3 date,
  reuniao4 date,
  leads_entregues integer not null default 0,
  leads_novos integer not null default 0,
  checkins_realizados integer not null default 0,
  checkins_faltados integer not null default 0,
  venda_originada date,
  venda_conduzida date,
  horas_padrinho numeric not null default 0,
  horas_psm numeric not null default 0,
  observacoes text
);

create table public.weeklies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data date not null default current_date,
  participantes text,
  pauta text,
  decisoes text,
  objecoes text
);

create table public.weekly_updates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  weekly_id uuid not null references public.weeklies(id) on delete cascade,
  dupla_id uuid not null references public.duplas(id) on delete cascade,
  situacao text check (situacao in ('no_ritmo', 'atencao', 'risco', 'concluida')),
  nota text,
  unique (weekly_id, dupla_id)
);

create table public.acoes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  weekly_id uuid not null references public.weeklies(id) on delete cascade,
  descricao text not null,
  responsavel text,
  prazo date,
  concluida boolean not null default false
);

create table public.base_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data date not null,
  cadastrados integer not null default 0,
  com_cliente integer not null default 0,
  ativados_60d integer not null default 0,
  tempo_medio_dias numeric,
  novos_mes integer
);

-- Acesso: qualquer usuário logado lê e escreve tudo (equipe compartilhada).
do $$
declare t text;
begin
  foreach t in array array['duplas', 'weeklies', 'weekly_updates', 'acoes', 'base_snapshots'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "equipe logada" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

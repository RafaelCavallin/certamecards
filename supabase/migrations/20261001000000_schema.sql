-- CertameCards — schema inicial: decks, cards, review_logs, user_settings, RLS e RPC sync_push.
--
-- Herdado do Lingo (supabase/migrations/20260802220448..53 + 20260818*), numa
-- migration só porque o banco nasce do zero. Diferenças de domínio:
--   decks: sem listen_first/voice/speech_rate; ganha request_retention.
--   cards: sentence/translation/phonetic/hints/cloze_ranges/emphasis_ranges
--          viram front/back/notes + marks (jsonb único com as marcas dos três
--          campos); ganha learning_steps (ts-fsrs v5) e tags (Fase 2).
--   user_settings: nova, uma linha por usuário (meta diária e lembrete, Fase 2).
-- Colunas e tabela da Fase 2 já nascem aqui para a RPC não precisar ser
-- reemitida quando a Fase 2 chegar.
--
-- Timestamps de domínio em bigint (epoch ms); synced_at é o cursor de pull,
-- mantido só pelo servidor. PK composta (user_id, id): ids nascem no cliente,
-- então cada usuário tem namespace próprio e a FK composta impede referência
-- entre contas.

create table public.decks (
  id                  uuid    not null,
  user_id             uuid    not null default auth.uid()
                              references auth.users(id) on delete cascade,
  name                text    not null check (char_length(name) between 1 and 80),
  new_cards_per_day   integer not null default 20 check (new_cards_per_day >= 0),
  young_limit         integer not null default 50 check (young_limit >= 0),
  request_retention   double precision not null default 0.9
                              check (request_retention between 0.7 and 0.99),
  fsrs_params         double precision[],
  params_optimized_at bigint,
  created_at          bigint  not null,
  updated_at          bigint  not null,
  deleted_at          bigint  not null default 0,
  synced_at           timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table public.cards (
  id             uuid   not null,
  user_id        uuid   not null default auth.uid()
                        references auth.users(id) on delete cascade,
  deck_id        uuid   not null,
  front          text   not null check (char_length(front) between 1 and 5000),
  back           text   not null check (char_length(back)  between 1 and 5000),
  notes          text   not null default '' check (char_length(notes) <= 20000),
  -- {"front":{"cloze":[{"start":0,"end":4}],"emphasis":[]},"back":{"emphasis":[]},"notes":{"emphasis":[]}}
  -- Lacuna só existe na frente. Chave ausente = sem marcas. Validado por Zod no cliente.
  marks          jsonb  not null default '{}'::jsonb
                        check (jsonb_typeof(marks) = 'object'),
  tags           text[] not null default '{}' check (cardinality(tags) <= 20),
  due            bigint not null,
  stability      double precision not null,
  difficulty     double precision not null,
  elapsed_days   double precision not null default 0,
  scheduled_days double precision not null,
  learning_steps integer not null default 0,
  reps           integer not null,
  lapses         integer not null,
  state          smallint not null check (state between 0 and 3),
  last_review    bigint,
  created_at     bigint not null,
  updated_at     bigint not null,
  deleted_at     bigint not null default 0,
  synced_at      timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  foreign key (user_id, deck_id)
    references public.decks (user_id, id) on delete cascade
);

-- Imutáveis: sem updated_at e sem deleted_at (heatmap e sequência contam o
-- estudo que aconteceu, mesmo de cartões excluídos depois).
create table public.review_logs (
  id             uuid   not null,
  user_id        uuid   not null default auth.uid()
                        references auth.users(id) on delete cascade,
  card_id        uuid   not null,
  deck_id        uuid   not null,
  rating         text   not null check (rating in ('again', 'good')),
  reviewed_at    bigint not null,
  state_before   smallint not null check (state_before between 0 and 3),
  scheduled_days double precision not null,
  duration_ms    integer not null check (duration_ms >= 0),
  synced_at      timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  foreign key (user_id, card_id)
    references public.cards (user_id, id) on delete cascade,
  foreign key (user_id, deck_id)
    references public.decks (user_id, id) on delete cascade
);

create table public.user_settings (
  user_id          uuid     not null default auth.uid() primary key
                            references auth.users(id) on delete cascade,
  daily_goal       integer  check (daily_goal between 10 and 500),  -- null = meta desligada
  reminder_enabled boolean  not null default false,
  reminder_minute  smallint not null default 1200 check (reminder_minute between 0 and 1439),
  time_zone        text     not null default 'America/Sao_Paulo',
  updated_at       bigint   not null,
  synced_at        timestamptz not null default clock_timestamp()
);

create index decks_pull_idx       on public.decks       (user_id, synced_at);
create index cards_pull_idx       on public.cards       (user_id, synced_at);
create index review_logs_pull_idx on public.review_logs (user_id, synced_at);
create index cards_deck_idx       on public.cards       (user_id, deck_id);
create index review_logs_card_idx on public.review_logs (user_id, card_id);
create index review_logs_deck_idx on public.review_logs (user_id, deck_id);
create index user_settings_pull_idx on public.user_settings (user_id, synced_at);

-- clock_timestamp(), não now(): num bulk insert, now() daria o mesmo
-- synced_at a todas as linhas e quebraria o desempate da paginação keyset.
create or replace function public.touch_synced_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

create trigger decks_touch_synced_at       before insert or update on public.decks
  for each row execute function public.touch_synced_at();
create trigger cards_touch_synced_at       before insert or update on public.cards
  for each row execute function public.touch_synced_at();
create trigger review_logs_touch_synced_at before insert on public.review_logs
  for each row execute function public.touch_synced_at();
create trigger user_settings_touch_synced_at before insert or update on public.user_settings
  for each row execute function public.touch_synced_at();

-- ---------- RLS e grants ----------

alter table public.decks       enable row level security;
alter table public.cards       enable row level security;
alter table public.review_logs enable row level security;
alter table public.user_settings enable row level security;

grant usage on schema public to authenticated;

-- Sem DELETE para ninguém: exclusão é sempre lógica (deleted_at).
-- review_logs sem UPDATE: imutável pelo banco, não por convenção.
grant select, insert, update on public.decks       to authenticated;
grant select, insert, update on public.cards       to authenticated;
grant select, insert         on public.review_logs to authenticated;
grant select, insert, update on public.user_settings to authenticated;

revoke all on public.decks       from anon;
revoke all on public.cards       from anon;
revoke all on public.review_logs from anon;
revoke all on public.user_settings from anon;

create policy "decks_select_own" on public.decks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "decks_insert_own" on public.decks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "decks_update_own" on public.decks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "cards_select_own" on public.cards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cards_insert_own" on public.cards
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cards_update_own" on public.cards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "review_logs_select_own" on public.review_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "review_logs_insert_own" on public.review_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "user_settings_select_own" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_settings_insert_own" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- RPC de push ----------
-- Transação única settings → decks → cards → logs, com LWW no servidor
-- (where excluded.updated_at > t.updated_at). Um .upsert() do PostgREST não
-- tem WHERE e sobrescreveria às cegas a versão mais nova de outro aparelho.
-- coalesce nos campos com default: jsonb_populate_recordset devolve null para
-- chave ausente no payload, não o default da coluna.
create or replace function public.sync_push(
  p_decks jsonb default '[]'::jsonb,
  p_cards jsonb default '[]'::jsonb,
  p_logs  jsonb default '[]'::jsonb,
  p_settings jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid   := (select auth.uid());
  -- Relógio de cliente adiantado vence por no máximo 1 hora.
  v_max bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint + 3600000;
  v_s int := 0; v_d int := 0; v_c int := 0; v_l int := 0;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  with src as (
    select * from jsonb_populate_recordset(null::public.user_settings, p_settings)
  ), up as (
    insert into public.user_settings as t (
      user_id, daily_goal, reminder_enabled, reminder_minute, time_zone, updated_at)
    select v_uid, s.daily_goal, coalesce(s.reminder_enabled, false),
           coalesce(s.reminder_minute, 1200), coalesce(s.time_zone, 'America/Sao_Paulo'),
           least(s.updated_at, v_max)
    from src s
    limit 1
    on conflict (user_id) do update set
      daily_goal       = excluded.daily_goal,
      reminder_enabled = excluded.reminder_enabled,
      reminder_minute  = excluded.reminder_minute,
      time_zone        = excluded.time_zone,
      updated_at       = excluded.updated_at
    where excluded.updated_at > t.updated_at
    returning 1
  ) select count(*) into v_s from up;

  with src as (
    select * from jsonb_populate_recordset(null::public.decks, p_decks)
  ), up as (
    insert into public.decks as t (
      id, user_id, name, new_cards_per_day, young_limit, request_retention,
      fsrs_params, params_optimized_at, created_at, updated_at, deleted_at)
    select s.id, v_uid, s.name, s.new_cards_per_day, s.young_limit,
           coalesce(s.request_retention, 0.9),
           s.fsrs_params, s.params_optimized_at,
           s.created_at, least(s.updated_at, v_max), coalesce(s.deleted_at, 0)
    from src s
    on conflict (user_id, id) do update set
      name                = excluded.name,
      new_cards_per_day   = excluded.new_cards_per_day,
      young_limit         = excluded.young_limit,
      request_retention   = excluded.request_retention,
      fsrs_params         = excluded.fsrs_params,
      params_optimized_at = excluded.params_optimized_at,
      updated_at          = excluded.updated_at,
      deleted_at          = excluded.deleted_at
    where excluded.updated_at > t.updated_at
    returning 1
  ) select count(*) into v_d from up;

  with src as (
    select * from jsonb_populate_recordset(null::public.cards, p_cards)
  ), up as (
    insert into public.cards as t (
      id, user_id, deck_id, front, back, notes, marks, tags,
      due, stability, difficulty, elapsed_days, scheduled_days, learning_steps,
      reps, lapses, state, last_review, created_at, updated_at, deleted_at)
    select s.id, v_uid, s.deck_id, s.front, s.back,
           coalesce(s.notes, ''), coalesce(s.marks, '{}'::jsonb), coalesce(s.tags, '{}'),
           s.due, s.stability, s.difficulty,
           coalesce(s.elapsed_days, 0), s.scheduled_days, coalesce(s.learning_steps, 0),
           s.reps, s.lapses, s.state, s.last_review,
           s.created_at, least(s.updated_at, v_max), coalesce(s.deleted_at, 0)
    from src s
    on conflict (user_id, id) do update set
      deck_id        = excluded.deck_id,
      front          = excluded.front,
      back           = excluded.back,
      notes          = excluded.notes,
      marks          = excluded.marks,
      tags           = excluded.tags,
      due            = excluded.due,
      stability      = excluded.stability,
      difficulty     = excluded.difficulty,
      elapsed_days   = excluded.elapsed_days,
      scheduled_days = excluded.scheduled_days,
      learning_steps = excluded.learning_steps,
      reps           = excluded.reps,
      lapses         = excluded.lapses,
      state          = excluded.state,
      last_review    = excluded.last_review,
      updated_at     = excluded.updated_at,
      deleted_at     = excluded.deleted_at
    where excluded.updated_at > t.updated_at
    returning 1
  ) select count(*) into v_c from up;

  with src as (
    select * from jsonb_populate_recordset(null::public.review_logs, p_logs)
  ), up as (
    insert into public.review_logs (
      id, user_id, card_id, deck_id, rating, reviewed_at,
      state_before, scheduled_days, duration_ms)
    select s.id, v_uid, s.card_id, s.deck_id, s.rating, s.reviewed_at,
           s.state_before, s.scheduled_days, s.duration_ms
    from src s
    on conflict (user_id, id) do nothing
    returning 1
  ) select count(*) into v_l from up;

  return jsonb_build_object('settings', v_s, 'decks', v_d, 'cards', v_c, 'logs', v_l);
end;
$$;

-- Postgres concede EXECUTE a PUBLIC por padrão; sem isto, anon chamaria a RPC.
revoke all on function public.sync_push(jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.sync_push(jsonb, jsonb, jsonb, jsonb) to authenticated;

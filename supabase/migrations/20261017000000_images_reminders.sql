-- CertameCards — Fase 2: imagens nas Notas (F17) e lembrete por Web Push (F13).
--
-- Imagens: metadados em card_images (sincronizados por LWW como os cards) e o
-- arquivo no Storage, bucket privado card-images, caminho {user_id}/{image_id}.
-- O push das imagens tem RPC própria para não reemitir sync_push: o cliente
-- sobe o arquivo primeiro e só depois os metadados, e só depois dos cards
-- (FK). Outro aparelho nunca vê metadado de arquivo que ainda não existe.
--
-- Lembrete: push_subscriptions por aparelho; users_due_for_reminder() é
-- chamada a cada 15 min pela Edge Function send-reminders (pg_cron), com
-- service_role. reminder_deliveries impede dois lembretes no mesmo dia local.

-- ---------- imagens ----------

create table public.card_images (
  id         uuid     not null,
  user_id    uuid     not null default auth.uid()
                      references auth.users(id) on delete cascade,
  card_id    uuid     not null,
  position   smallint not null check (position between 0 and 5),
  caption    text     not null default '' check (char_length(caption) <= 200),
  mime_type  text     not null check (mime_type in ('image/webp', 'image/jpeg', 'image/png')),
  width      integer  not null check (width  between 1 and 2000),
  height     integer  not null check (height between 1 and 2000),
  byte_size  integer  not null check (byte_size between 1 and 1572864),
  created_at bigint   not null,
  updated_at bigint   not null,
  deleted_at bigint   not null default 0,
  synced_at  timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  foreign key (user_id, card_id) references public.cards (user_id, id) on delete cascade
);

create index card_images_pull_idx on public.card_images (user_id, synced_at);
create index card_images_card_idx on public.card_images (user_id, card_id);

create trigger card_images_touch_synced_at before insert or update on public.card_images
  for each row execute function public.touch_synced_at();

alter table public.card_images enable row level security;
grant select, insert, update on public.card_images to authenticated;
revoke all on public.card_images from anon;

create policy "card_images_select_own" on public.card_images
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "card_images_insert_own" on public.card_images
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "card_images_update_own" on public.card_images
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.sync_push_images(p_images jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid   := (select auth.uid());
  v_max bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint + 3600000;
  v_i int := 0;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  with src as (
    select * from jsonb_populate_recordset(null::public.card_images, p_images)
  ), up as (
    insert into public.card_images as t (
      id, user_id, card_id, position, caption, mime_type, width, height, byte_size,
      created_at, updated_at, deleted_at)
    select s.id, v_uid, s.card_id, s.position, coalesce(s.caption, ''), s.mime_type,
           s.width, s.height, s.byte_size,
           s.created_at, least(s.updated_at, v_max), coalesce(s.deleted_at, 0)
    from src s
    on conflict (user_id, id) do update set
      position   = excluded.position,
      caption    = excluded.caption,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at
    where excluded.updated_at > t.updated_at
    returning 1
  ) select count(*) into v_i from up;

  return jsonb_build_object('images', v_i);
end;
$$;

revoke all on function public.sync_push_images(jsonb) from public;
grant execute on function public.sync_push_images(jsonb) to authenticated;

-- Arquivo imutável: sem update. Delete permitido só para a limpeza feita pelo
-- próprio dono depois que o tombstone do metadado subiu.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-images', 'card-images', false, 1572864,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "card_images_objects_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'card-images'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "card_images_objects_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'card-images'
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "card_images_objects_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'card-images'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- lembrete ----------

-- Não é dado de estudo: não entra no sync, e delete é permitido (sair da
-- conta ou desligar o lembrete remove a inscrição do aparelho).
create table public.push_subscriptions (
  user_id         uuid not null default auth.uid()
                       references auth.users(id) on delete cascade,
  endpoint        text not null check (endpoint like 'https://%'),
  p256dh          text not null,
  auth_key        text not null,
  created_at      timestamptz not null default now(),
  last_success_at timestamptz,
  primary key (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
grant select, insert, delete on public.push_subscriptions to authenticated;
revoke all on public.push_subscriptions from anon;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Só service_role escreve/lê (sem grant para authenticated).
create table public.reminder_deliveries (
  user_id    uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, local_date)
);

alter table public.reminder_deliveries enable row level security;
revoke all on public.reminder_deliveries from anon, authenticated;

-- Quem deve receber lembrete agora: lembrete ligado, dentro da janela de
-- 60 min depois do horário escolhido (no fuso do usuário), ainda sem
-- lembrete hoje e abaixo da meta (sem meta: nenhuma revisão hoje).
-- Conta só revisões já sincronizadas — ver Riscos na techspec.
create or replace function public.users_due_for_reminder(p_now timestamptz default now())
returns table (user_id uuid, endpoint text, p256dh text, auth_key text, local_date date)
language sql
stable
security definer
set search_path = ''
as $$
  with local_now as (
    select s.user_id, s.daily_goal, s.reminder_minute, s.time_zone,
           (p_now at time zone s.time_zone) as ts
    from public.user_settings s
    where s.reminder_enabled
  ), due as (
    select n.user_id, n.ts::date as local_date,
           (extract(epoch from (date_trunc('day', n.ts) at time zone n.time_zone)) * 1000)::bigint
             as day_start_ms,
           coalesce(n.daily_goal, 1) as goal
    from local_now n
    where (extract(hour from n.ts) * 60 + extract(minute from n.ts))
          between n.reminder_minute and n.reminder_minute + 59
  )
  select d.user_id, ps.endpoint, ps.p256dh, ps.auth_key, d.local_date
  from due d
  join public.push_subscriptions ps on ps.user_id = d.user_id
  where not exists (
          select 1 from public.reminder_deliveries r
          where r.user_id = d.user_id and r.local_date = d.local_date)
    and (select count(*) from public.review_logs l
         where l.user_id = d.user_id and l.reviewed_at >= d.day_start_ms) < d.goal;
$$;

revoke all on function public.users_due_for_reminder(timestamptz) from public, anon, authenticated;
grant execute on function public.users_due_for_reminder(timestamptz) to service_role;

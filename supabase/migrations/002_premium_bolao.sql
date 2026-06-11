create type public.premium_prediction_status as enum ('active', 'cancelled');

create or replace view public.leaderboard as
select
  p.id as user_id,
  p.name,
  coalesce(sum(pr.points), 0)::integer as total_points,
  coalesce(count(*) filter (where pr.is_exact_score), 0)::integer as exact_scores,
  coalesce(count(pr.id), 0)::integer as predictions_count
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.name;

create table public.premium_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  stake_amount numeric(10, 2) not null default 2.00,
  status public.premium_prediction_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id),
  constraint premium_predictions_scores_non_negative check (home_score >= 0 and away_score >= 0),
  constraint premium_predictions_stake_positive check (stake_amount > 0)
);

create index premium_predictions_user_id_idx on public.premium_predictions(user_id);
create index premium_predictions_match_id_idx on public.premium_predictions(match_id);

create or replace function public.set_premium_prediction_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  match_record public.matches;
begin
  select *
  into match_record
  from public.matches
  where id = new.match_id;

  if not found then
    raise exception 'Match not found.';
  end if;

  if match_record.is_premium = false then
    raise exception 'Este jogo nao e premium.';
  end if;

  if match_record.status = 'finished' or now() >= match_record.bid_closes_at then
    raise exception 'Apostas premium encerradas para este jogo.';
  end if;

  if not exists (
    select 1
    from public.premium_entries pe
    where pe.user_id = new.user_id
  ) then
    raise exception 'Aceite o Bolao Premium antes de apostar.';
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'active'
    and new.status = 'active'
    and old.stake_amount <> new.stake_amount then
    raise exception 'Nao e permitido alterar o valor da entrada.';
  end if;

  new.stake_amount := coalesce(new.stake_amount, 2.00);
  new.updated_at := now();

  return new;
end;
$$;

create trigger set_premium_prediction_defaults_trigger
before insert or update on public.premium_predictions
for each row execute function public.set_premium_prediction_defaults();

create or replace function public.prevent_match_delete_with_premium_predictions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.premium_predictions pp
    where pp.match_id = old.id
      and pp.status = 'active'
  ) then
    raise exception 'Nao e possivel apagar um jogo com apostas premium.';
  end if;

  return old;
end;
$$;

create trigger prevent_match_delete_with_premium_predictions_trigger
before delete on public.matches
for each row execute function public.prevent_match_delete_with_premium_predictions();

create or replace function public.prevent_match_unpremium_with_predictions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.is_premium = true
    and new.is_premium = false
    and exists (
      select 1
      from public.premium_predictions pp
      where pp.match_id = old.id
        and pp.status = 'active'
    ) then
    raise exception 'Nao e possivel desmarcar premium com apostas premium.';
  end if;

  return new;
end;
$$;

create trigger prevent_match_unpremium_with_predictions_trigger
before update of is_premium on public.matches
for each row execute function public.prevent_match_unpremium_with_predictions();

create or replace view public.premium_match_summary as
with active_predictions as (
  select *
  from public.premium_predictions
  where status = 'active'
),
winner_counts as (
  select
    m.id as match_id,
    count(ap.id)::integer as winners_count
  from public.matches m
  left join active_predictions ap
    on ap.match_id = m.id
    and m.status = 'finished'
    and ap.home_score = m.home_score
    and ap.away_score = m.away_score
  group by m.id
),
stake_totals as (
  select
    match_id,
    count(*)::integer as predictions_count,
    coalesce(sum(stake_amount), 0)::numeric(10, 2) as pot_amount
  from active_predictions
  group by match_id
)
select
  m.id as match_id,
  m.home_team,
  m.away_team,
  m.starts_at,
  m.bid_closes_at,
  m.status,
  m.home_score,
  m.away_score,
  coalesce(st.predictions_count, 0)::integer as predictions_count,
  coalesce(st.pot_amount, 0)::numeric(10, 2) as pot_amount,
  coalesce(wc.winners_count, 0)::integer as winners_count,
  case
    when m.status = 'finished' and coalesce(st.predictions_count, 0) > 0 and coalesce(wc.winners_count, 0) = 0 then true
    else false
  end as is_refunded,
  case
    when m.status = 'finished' and coalesce(wc.winners_count, 0) > 0
      then (coalesce(st.pot_amount, 0) / wc.winners_count)::numeric(10, 2)
    else 0::numeric(10, 2)
  end as payout_per_winner
from public.matches m
left join stake_totals st on st.match_id = m.id
left join winner_counts wc on wc.match_id = m.id
where m.is_premium = true;

create or replace view public.premium_ledger_entries as
select
  ('stake-' || pp.id::text) as id,
  pp.user_id,
  pp.match_id,
  'stake'::text as type,
  (-pp.stake_amount)::numeric(10, 2) as amount,
  'Aposta premium'::text as description,
  pp.created_at
from public.premium_predictions pp
where pp.status = 'active'
  and (pp.user_id = auth.uid() or public.is_super_admin())

union all

select
  ('refund-' || pp.id::text) as id,
  pp.user_id,
  pp.match_id,
  'refund'::text as type,
  pp.stake_amount::numeric(10, 2) as amount,
  'Pote devolvido'::text as description,
  greatest(pp.updated_at, m.updated_at) as created_at
from public.premium_predictions pp
join public.matches m on m.id = pp.match_id
where pp.status = 'active'
  and (pp.user_id = auth.uid() or public.is_super_admin())
  and m.status = 'finished'
  and not exists (
    select 1
    from public.premium_predictions winner
    where winner.match_id = pp.match_id
      and winner.status = 'active'
      and winner.home_score = m.home_score
      and winner.away_score = m.away_score
  )

union all

select
  ('payout-' || pp.id::text) as id,
  pp.user_id,
  pp.match_id,
  'payout'::text as type,
  (
    (
      select sum(all_pp.stake_amount)
      from public.premium_predictions all_pp
      where all_pp.match_id = pp.match_id
        and all_pp.status = 'active'
    ) / nullif((
      select count(*)
      from public.premium_predictions winner
      where winner.match_id = pp.match_id
        and winner.status = 'active'
        and winner.home_score = m.home_score
        and winner.away_score = m.away_score
    ), 0)
  )::numeric(10, 2) as amount,
  'Premio por placar exato'::text as description,
  greatest(pp.updated_at, m.updated_at) as created_at
from public.premium_predictions pp
join public.matches m on m.id = pp.match_id
where pp.status = 'active'
  and (pp.user_id = auth.uid() or public.is_super_admin())
  and m.status = 'finished'
  and pp.home_score = m.home_score
  and pp.away_score = m.away_score;

create or replace view public.premium_balances as
select
  p.id as user_id,
  p.name,
  coalesce(sum(le.amount), 0)::numeric(10, 2) as balance
from public.profiles p
join public.premium_entries pe on pe.user_id = p.id
left join public.premium_ledger_entries le on le.user_id = p.id
where p.id = auth.uid() or public.is_super_admin()
group by p.id, p.name;

alter table public.premium_predictions enable row level security;

create policy "Premium predictions are readable by authenticated users"
on public.premium_predictions for select
to authenticated
using (status = 'active' or user_id = auth.uid() or public.is_super_admin());

create policy "Users can insert their premium predictions"
on public.premium_predictions for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.premium_entries pe where pe.user_id = auth.uid())
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.is_premium = true
      and m.status <> 'finished'
      and now() < m.bid_closes_at
  )
);

create policy "Users can update their premium predictions"
on public.premium_predictions for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.is_premium = true
      and m.status <> 'finished'
      and now() < m.bid_closes_at
  )
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.premium_entries pe where pe.user_id = auth.uid())
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.is_premium = true
      and m.status <> 'finished'
      and now() < m.bid_closes_at
  )
);

create policy "Super admins can manage premium predictions"
on public.premium_predictions for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

grant select, insert, update on public.premium_predictions to authenticated;
grant select on public.premium_match_summary to authenticated;
grant select on public.premium_ledger_entries to authenticated;
grant select on public.premium_balances to authenticated;

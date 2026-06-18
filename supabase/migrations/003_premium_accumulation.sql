-- Add accumulated_pot column to matches to carry forward unawarded premium pots
alter table public.matches
  add column accumulated_pot numeric(10, 2) not null default 0;

-- Update premium_match_summary view to include accumulated_pot in pot_amount
-- and expose has_accumulated_pot flag
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
    coalesce(sum(stake_amount), 0)::numeric(10, 2) as stakes_amount
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
  (coalesce(st.stakes_amount, 0) + m.accumulated_pot)::numeric(10, 2) as pot_amount,
  coalesce(wc.winners_count, 0)::integer as winners_count,
  -- is_refunded is now always false — no more refunds, pot accumulates instead
  false as is_refunded,
  case
    when m.status = 'finished' and coalesce(wc.winners_count, 0) > 0
      then ((coalesce(st.stakes_amount, 0) + m.accumulated_pot) / wc.winners_count)::numeric(10, 2)
    else 0::numeric(10, 2)
  end as payout_per_winner,
  m.accumulated_pot,
  (m.accumulated_pot > 0) as has_accumulated_pot
from public.matches m
left join stake_totals st on st.match_id = m.id
left join winner_counts wc on wc.match_id = m.id
where m.is_premium = true;

-- Update premium_ledger_entries: replace refund entries with 'accumulated' (informational, zero balance impact)
-- and update payout to use total pot (stakes + accumulated_pot)
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

-- Payout for winners (total pot including accumulated, divided by winners)
select
  ('payout-' || pp.id::text) as id,
  pp.user_id,
  pp.match_id,
  'payout'::text as type,
  (
    (
      (
        select coalesce(sum(all_pp.stake_amount), 0)
        from public.premium_predictions all_pp
        where all_pp.match_id = pp.match_id
          and all_pp.status = 'active'
      ) + (
        select m2.accumulated_pot
        from public.matches m2
        where m2.id = pp.match_id
      )
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

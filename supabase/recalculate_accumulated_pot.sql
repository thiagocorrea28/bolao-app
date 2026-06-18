-- Recalculate accumulated_pot for all premium matches in chronological order.
-- Run this once in the Supabase SQL editor to fix historical data.

do $$
declare
  rec       record;
  carry     numeric(10,2) := 0;
  stakes    numeric(10,2);
  has_winner boolean;
  next_id   uuid;
begin
  -- Reset all accumulated_pot to 0 first
  update public.matches
  set accumulated_pot = 0
  where is_premium = true;

  -- Walk premium matches in chronological order
  for rec in
    select id, home_score, away_score, status, starts_at
    from public.matches
    where is_premium = true
    order by starts_at asc
  loop
    -- Apply any carry from previous match(es) to this match
    if carry > 0 then
      update public.matches
      set accumulated_pot = carry
      where id = rec.id;
    end if;

    -- Only finished matches can generate a carry
    if rec.status = 'finished' then
      -- Total stakes for this match
      select coalesce(sum(stake_amount), 0)
      into stakes
      from public.premium_predictions
      where match_id = rec.id and status = 'active';

      -- Check if anyone won
      select exists(
        select 1 from public.premium_predictions
        where match_id = rec.id
          and status = 'active'
          and home_score = rec.home_score
          and away_score = rec.away_score
      ) into has_winner;

      if not has_winner and stakes > 0 then
        -- Carry forward = stakes + whatever was already carried into this match
        carry := stakes + carry;
      else
        -- Winners received the pot; reset carry
        carry := 0;
      end if;
    else
      -- Match not yet finished; stop propagating carry (already applied above)
      carry := 0;
    end if;
  end loop;
end;
$$;

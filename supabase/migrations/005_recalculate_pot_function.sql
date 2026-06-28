-- Encapsulates recalculate_accumulated_pot.sql as a callable RPC function
-- so the admin UI can trigger it without direct SQL editor access.

create or replace function public.recalculate_premium_pot()
returns void
language plpgsql
security definer
as $$
declare
  rec        record;
  carry      numeric(10,2) := 0;
  stakes     numeric(10,2);
  has_winner boolean;
begin
  -- Reset all accumulated_pot to 0
  update public.matches
  set accumulated_pot = 0
  where is_premium = true;

  -- Walk premium matches in chronological order
  for rec in
    select id, home_score, away_score, status
    from public.matches
    where is_premium = true
    order by starts_at asc
  loop
    if carry > 0 then
      update public.matches
      set accumulated_pot = carry
      where id = rec.id;
    end if;

    if rec.status = 'finished' then
      select coalesce(sum(stake_amount), 0)
      into stakes
      from public.premium_predictions
      where match_id = rec.id and status = 'active';

      select exists(
        select 1 from public.premium_predictions
        where match_id = rec.id
          and status = 'active'
          and home_score = rec.home_score
          and away_score = rec.away_score
      ) into has_winner;

      if not has_winner and stakes > 0 then
        carry := stakes + carry;
      else
        carry := 0;
      end if;
    else
      carry := 0;
    end if;
  end loop;
end;
$$;

-- Only super admins can call this function
revoke execute on function public.recalculate_premium_pot() from public, anon, authenticated;
grant execute on function public.recalculate_premium_pot() to authenticated;

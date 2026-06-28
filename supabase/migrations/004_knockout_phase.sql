-- Knockout phase support
-- Adds is_knockout, knockout_phase, winner to matches
-- Adds predicted_winner to predictions
-- Updates points trigger to grant +1 bonus when draw + correct winner

alter table public.matches
  add column is_knockout boolean not null default false,
  add column knockout_phase text,
  add column winner text check (winner in ('home', 'away'));

alter table public.predictions
  add column predicted_winner text check (predicted_winner in ('home', 'away'));

-- Update points trigger to include the +1 knockout winner bonus
create or replace function public.score_prediction()
returns trigger
language plpgsql
security definer
as $$
declare
  match_record public.matches;
begin
  select * into match_record from public.matches where id = new.match_id;

  if match_record.status <> 'finished' then
    return new;
  end if;

  new.points := 0;
  new.is_exact_score := false;

  new.is_exact_score := (
    new.home_score = match_record.home_score
    and new.away_score = match_record.away_score
  );

  new.points := case
    when new.is_exact_score then 3
    when public.predicted_outcome(new.home_score, new.away_score)
      = public.predicted_outcome(match_record.home_score, match_record.away_score) then 1
    else 0
  end;

  -- Knockout draw bonus: +1 if draw and predicted the correct team to advance
  if match_record.is_knockout
    and match_record.home_score = match_record.away_score
    and match_record.winner is not null
    and new.predicted_winner = match_record.winner
  then
    new.points := new.points + 1;
  end if;

  return new;
end;
$$;

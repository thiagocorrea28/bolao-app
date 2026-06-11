create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'super_admin');
create type public.match_status as enum ('open', 'locked', 'finished');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  starts_at timestamptz not null,
  bid_closes_at timestamptz not null,
  status public.match_status not null default 'open',
  is_premium boolean not null default false,
  home_score integer,
  away_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_different_teams check (lower(home_team) <> lower(away_team)),
  constraint matches_scores_non_negative check (
    (home_score is null or home_score >= 0)
    and (away_score is null or away_score >= 0)
  ),
  constraint matches_finished_has_score check (
    status <> 'finished'
    or (home_score is not null and away_score is not null)
  )
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  points integer not null default 0,
  is_exact_score boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id),
  constraint predictions_scores_non_negative check (home_score >= 0 and away_score >= 0)
);

-- Reserved for the future premium phase, where users explicitly opt in.
create table public.premium_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  unique (user_id)
);

create index matches_starts_at_idx on public.matches(starts_at);
create index predictions_user_id_idx on public.predictions(user_id);
create index predictions_match_id_idx on public.predictions(match_id);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    case
      when lower(new.email) = 'thiagogcorrea28@gmail.com' then 'super_admin'::public.user_role
      else 'user'::public.user_role
    end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_match_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.bid_closes_at := new.starts_at - interval '10 minutes';
  new.updated_at := now();

  if new.status = 'finished' and (new.home_score is null or new.away_score is null) then
    raise exception 'Finished matches need a final score.';
  end if;

  return new;
end;
$$;

create trigger set_match_defaults_trigger
before insert or update on public.matches
for each row execute function public.set_match_defaults();

create or replace function public.predicted_outcome(home_score integer, away_score integer)
returns integer
language sql
immutable
as $$
  select case
    when home_score > away_score then 1
    when home_score < away_score then -1
    else 0
  end;
$$;

create or replace function public.apply_prediction_score()
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

  if match_record.status <> 'finished' then
    if now() >= match_record.bid_closes_at then
      raise exception 'Apostas encerradas para este jogo.';
    end if;

    new.points := 0;
    new.is_exact_score := false;
  else
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
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger apply_prediction_score_trigger
before insert or update on public.predictions
for each row execute function public.apply_prediction_score();

create or replace function public.recalculate_match_predictions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.predictions
  set updated_at = now()
  where match_id = new.id;

  return new;
end;
$$;

create trigger recalculate_match_predictions_trigger
after update of home_score, away_score, status on public.matches
for each row
when (
  old.home_score is distinct from new.home_score
  or old.away_score is distinct from new.away_score
  or old.status is distinct from new.status
)
execute function public.recalculate_match_predictions();

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

create or replace view public.premium_leaderboard as
select
  p.id as user_id,
  p.name,
  coalesce(sum(pr.points) filter (where m.is_premium = true), 0)::integer as total_points,
  coalesce(count(*) filter (where m.is_premium = true and pr.is_exact_score), 0)::integer as exact_scores,
  coalesce(count(*) filter (where m.is_premium = true), 0)::integer as predictions_count
from public.profiles p
join public.premium_entries pe on pe.user_id = p.id
left join public.predictions pr on pr.user_id = p.id
left join public.matches m on m.id = pr.match_id
group by p.id, p.name;

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.premium_entries enable row level security;

create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Matches are readable by authenticated users"
on public.matches for select
to authenticated
using (true);

create policy "Super admins can insert matches"
on public.matches for insert
to authenticated
with check (public.is_super_admin());

create policy "Super admins can update matches"
on public.matches for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admins can delete matches"
on public.matches for delete
to authenticated
using (public.is_super_admin());

create policy "Predictions are readable by authenticated users"
on public.predictions for select
to authenticated
using (true);

create policy "Users can insert their open predictions"
on public.predictions for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status <> 'finished'
      and now() < m.bid_closes_at
  )
);

create policy "Users can update their open predictions"
on public.predictions for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status <> 'finished'
      and now() < m.bid_closes_at
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status <> 'finished'
      and now() < m.bid_closes_at
  )
);

create policy "Premium entries readable by authenticated users"
on public.premium_entries for select
to authenticated
using (true);

create policy "Users can accept premium entry"
on public.premium_entries for insert
to authenticated
with check (user_id = auth.uid());

create policy "Super admins can manage premium entries"
on public.premium_entries for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update on public.predictions to authenticated;
grant select, insert, update, delete on public.premium_entries to authenticated;
grant select on public.leaderboard to authenticated;
grant select on public.premium_leaderboard to authenticated;

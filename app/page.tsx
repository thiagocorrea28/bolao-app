import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile } from "@/lib/types";
import { addDays, dayBounds, formatDateLabel, toDateInputValue } from "@/lib/utils";

export default async function HomePage({
  searchParams
}: {
  searchParams: { date?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    redirect("/login");
  }

  const { date, start, end } = dayBounds(searchParams.date);
  const dateValue = toDateInputValue(date);
  const previousDate = toDateInputValue(addDays(date, -1));
  const nextDate = toDateInputValue(addDays(date, 1));

  const { data: matches = [] } = await supabase
    .from("matches")
    .select("*")
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true })
    .returns<Match[]>();
  const matchRows = matches ?? [];

  const matchIds = matchRows.map((match) => match.id);
  const { data: predictions = [] } = matchIds.length
    ? await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id)
        .in("match_id", matchIds)
        .returns<Prediction[]>()
    : { data: [] };
  const predictionRows = predictions ?? [];

  const { data: premiumEntry } = await supabase
    .from("premium_entries")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const predictionsByMatch = new Map(predictionRows.map((prediction) => [prediction.match_id, prediction]));
  const isToday = dateValue === toDateInputValue(new Date());

  return (
    <AppShell profile={profile}>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mint">
            {isToday ? "Jogos de hoje" : "Jogos do dia"}
          </p>
          <h1 className="mt-1 text-3xl font-black capitalize">{formatDateLabel(date)}</h1>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:w-auto">
          <Link className="btn-secondary px-3" href={`/?date=${previousDate}`} title="Dia anterior">
            <ChevronLeft size={18} />
          </Link>
          <Link className="btn-secondary" href="/">
            Hoje
          </Link>
          <Link className="btn-secondary px-3" href={`/?date=${nextDate}`} title="Proximo dia">
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {matchRows.length > 0 ? (
        <div className="grid gap-4">
          {matchRows.map((match) => (
            <MatchCard
              date={dateValue}
              hasPremiumEntry={Boolean(premiumEntry)}
              key={match.id}
              match={match}
              prediction={predictionsByMatch.get(match.id)}
            />
          ))}
        </div>
      ) : (
        <div className="surface p-8 text-center">
          <h2 className="text-xl font-black">Nenhum jogo cadastrado para este dia</h2>
          {profile.role === "super_admin" ? (
            <Link className="btn-primary mt-4" href="/admin">
              Cadastrar jogos
            </Link>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

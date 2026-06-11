import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile } from "@/lib/types";
import { formatKickoff } from "@/lib/utils";

type HistoryRow = Prediction & {
  matches: Match;
};

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: viewer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single<Profile>();

  if (!profile) {
    notFound();
  }

  const { data: history = [] } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })
    .returns<HistoryRow[]>();
  const historyRows = history ?? [];

  return (
    <AppShell profile={viewer}>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mint">Historico de apostas</p>
          <h1 className="mt-1 text-3xl font-black">{profile.name}</h1>
        </div>
        <BackButton />
      </section>

      <div className="grid gap-3">
        {historyRows.map((item) => (
          <article className="surface p-4" key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/60">
                  {formatKickoff(item.matches.starts_at)}
                </p>
                <h2 className="mt-1 text-lg font-black">
                  {item.matches.home_team} x {item.matches.away_team}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink/60">Aposta</p>
                <p className="text-xl font-black">
                  {item.home_score} x {item.away_score}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-ink/70">
              {item.matches.status === "finished" ? (
                <>
                  <span className="rounded-md bg-white/5 px-3 py-1">
                    Resultado: {item.matches.home_score} x {item.matches.away_score}
                  </span>
                  <span className="rounded-md bg-mint/10 px-3 py-1 font-bold text-mint">
                    +{item.points} pts
                  </span>
                  {item.is_exact_score ? (
                    <span className="rounded-md bg-white/5 px-3 py-1">Placar exato</span>
                  ) : null}
                </>
              ) : (
                <span className="rounded-md bg-white/5 px-3 py-1">Jogo ainda nao finalizado</span>
              )}
            </div>
          </article>
        ))}

        {historyRows.length === 0 ? (
          <div className="surface p-8 text-center text-ink/70">Nenhuma aposta registrada.</div>
        ) : null}
      </div>
    </AppShell>
  );
}

import { notFound, redirect } from "next/navigation";
import { Star, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import type {
  PremiumLedgerEntry,
  PremiumMatchSummary,
  PremiumPrediction,
  Profile
} from "@/lib/types";
import { formatEuro, formatKickoff } from "@/lib/utils";

type PremiumPredictionWithProfile = PremiumPrediction & {
  profiles: Pick<Profile, "name"> | null;
};

export default async function PremiumMatchDetailPage({ params }: { params: { id: string } }) {
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

  const { data: premiumEntry } = await supabase
    .from("premium_entries")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!premiumEntry && profile.role !== "super_admin") {
    redirect("/premium");
  }

  const { data: summary } = await supabase
    .from("premium_match_summary")
    .select("*")
    .eq("match_id", params.id)
    .maybeSingle<PremiumMatchSummary>();

  if (!summary) {
    notFound();
  }

  const { data: predictions = [] } = await supabase
    .from("premium_predictions")
    .select("*, profiles(name)")
    .eq("match_id", params.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<PremiumPredictionWithProfile[]>();
  const predictionRows = predictions ?? [];

  const { data: ledger = [] } = await supabase
    .from("premium_ledger_entries")
    .select("*")
    .eq("match_id", params.id)
    .order("created_at", { ascending: true })
    .returns<PremiumLedgerEntry[]>();
  const ledgerRows = ledger ?? [];

  const ledgerUserIds = Array.from(new Set(ledgerRows.map((entry) => entry.user_id)));
  const { data: ledgerProfiles = [] } = ledgerUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, name")
        .in("id", ledgerUserIds)
        .returns<Pick<Profile, "id" | "name">[]>()
    : { data: [] };
  const ledgerProfileRows = ledgerProfiles ?? [];
  const ledgerProfileById = new Map(ledgerProfileRows.map((item) => [item.id, item]));

  const isWinner = (prediction: PremiumPrediction) =>
    summary.status === "finished" &&
    prediction.home_score === summary.home_score &&
    prediction.away_score === summary.away_score;

  return (
    <AppShell profile={profile}>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-100">
            <Star size={17} />
            Detalhe Premium
          </p>
          <h1 className="mt-1 text-3xl font-black">
            {summary.home_team} <span className="text-ink/40">x</span> {summary.away_team}
          </h1>
          <p className="mt-2 text-sm text-ink/70">{formatKickoff(summary.starts_at)}</p>
        </div>
        <BackButton fallback="/premium" />
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="surface border-amber-300/20 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Pote</p>
          <p className="mt-1 text-3xl font-black text-amber-100">{formatEuro(summary.pot_amount)}</p>
        </div>
        <div className="surface border-amber-300/20 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Apostas</p>
          <p className="mt-1 text-3xl font-black">{summary.predictions_count}</p>
        </div>
        <div className="surface border-amber-300/20 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Resultado</p>
          <p className="mt-1 text-3xl font-black">
            {summary.status === "finished" ? `${summary.home_score} x ${summary.away_score}` : "Aberto"}
          </p>
        </div>
      </section>

      {summary.status === "finished" && summary.winners_count === 0 && summary.predictions_count > 0 ? (
        <div className="mb-6 surface border-cupGold/25 bg-cupGold/10 p-4 text-cupGold">
          Ninguem acertou o placar exato — pote de {formatEuro(summary.pot_amount)} acumulado para a proxima partida premium.
        </div>
      ) : null}

      {summary.has_accumulated_pot ? (
        <div className="mb-6 surface border-cupGold/25 bg-cupGold/10 p-4 text-amber-50">
          Este pote inclui <strong>{formatEuro(summary.accumulated_pot)}</strong> acumulado de partidas anteriores.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <div className="surface overflow-hidden border-amber-300/20">
          <div className="border-b border-line px-4 py-3 text-sm font-bold uppercase tracking-wide text-amber-100/75">
            Apostas premium
          </div>
          <div className="divide-y divide-line">
            {predictionRows.map((prediction) => (
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3" key={prediction.id}>
                <div>
                  <p className="font-semibold">{prediction.profiles?.name ?? "Jogador"}</p>
                  <p className="text-sm text-ink/60">
                    Aposta: {prediction.home_score} x {prediction.away_score}
                  </p>
                </div>
                {isWinner(prediction) ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-mint/10 px-3 py-1 text-sm font-bold text-mint">
                    <Trophy size={15} />
                    Vencedor
                  </span>
                ) : null}
              </div>
            ))}

            {predictionRows.length === 0 ? (
              <div className="p-6 text-center text-ink/70">Nenhuma aposta premium neste jogo.</div>
            ) : null}
          </div>
        </div>

        <div className="surface overflow-hidden border-amber-300/20">
          <div className="border-b border-line px-4 py-3 text-sm font-bold uppercase tracking-wide text-amber-100/75">
            Lancamentos
          </div>
          <div className="divide-y divide-line">
            {ledgerRows.map((entry) => (
              <div className="flex items-center justify-between gap-3 px-4 py-3" key={entry.id}>
                <div>
                  <p className="font-semibold">{ledgerProfileById.get(entry.user_id)?.name ?? "Jogador"}</p>
                  <p className="text-sm text-ink/60">{entry.description}</p>
                </div>
                <span className={Number(entry.amount) >= 0 ? "font-black text-mint" : "font-black text-red-200"}>
                  {formatEuro(entry.amount)}
                </span>
              </div>
            ))}

            {ledgerRows.length === 0 ? (
              <div className="p-6 text-center text-ink/70">Sem lancamentos ainda.</div>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

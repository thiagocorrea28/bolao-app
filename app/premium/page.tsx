import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { PremiumBalance } from "@/components/premium-balance";
import { PremiumPredictionForm } from "@/components/premium-prediction-form";
import { acceptPremium } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import type {
  PremiumBalance as PremiumBalanceRow,
  PremiumEntry,
  PremiumMatchSummary,
  PremiumPrediction,
  Profile
} from "@/lib/types";
import { canPredict, formatBidCountdown, formatEuro, formatKickoff } from "@/lib/utils";

export default async function PremiumPage() {
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

  const { data: entry } = await supabase
    .from("premium_entries")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<PremiumEntry>();

  if (!entry && profile.role !== "super_admin") {
    return (
      <AppShell profile={profile}>
        <section className="mx-auto max-w-2xl">
          <div className="surface border-cupGold/25 bg-cupGold/10 p-6">
            <div className="mb-4 flex items-center gap-2 text-cupGold">
              <Star size={22} />
              <p className="text-sm font-bold uppercase tracking-wide">Bolão Premium</p>
            </div>
            <h1 className="text-3xl font-black">Entrar no Bolao Premium</h1>
            <p className="mt-4 text-ink/75">
              Ao participar do Premium, cada aposta em jogo premium custa 2,00€. O valor
              entra no pote do jogo. Quem acertar o placar exato divide o pote. Seu saldo
              pode ficar negativo e sera acompanhado em conta corrente.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <form action={acceptPremium}>
                <button className="btn-primary bg-cupGold text-pitch hover:bg-yellow-200">
                  <Star size={18} />
                  Aceito participar
                </button>
              </form>
              <BackButton fallback="/" />
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  const { data: summaries = [] } = await supabase
    .from("premium_match_summary")
    .select("*")
    .order("starts_at", { ascending: true })
    .returns<PremiumMatchSummary[]>();
  const summaryRows = summaries ?? [];

  const matchIds = summaryRows.map((match) => match.match_id);
  const { data: predictions = [] } = matchIds.length
    ? await supabase
        .from("premium_predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("match_id", matchIds)
        .returns<PremiumPrediction[]>()
    : { data: [] };
  const predictionRows = predictions ?? [];

  const { data: balance } = await supabase
    .from("premium_balances")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<PremiumBalanceRow>();

  const { data: balances = [] } =
    profile.role === "super_admin"
      ? await supabase
          .from("premium_balances")
          .select("*")
          .order("balance", { ascending: false })
          .returns<PremiumBalanceRow[]>()
      : { data: [] };
  const balanceRows = balances ?? [];

  const predictionsByMatch = new Map(predictionRows.map((prediction) => [prediction.match_id, prediction]));
  const totalPot = summaryRows
    .filter((m) => m.status !== "finished")
    .reduce((sum, m) => sum + Number(m.pot_amount), 0);

  return (
    <AppShell profile={profile}>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-100">
            <Star size={17} />
            Bolão Premium
          </p>
          <h1 className="mt-1 text-3xl font-black">Conta corrente premium</h1>
        </div>
        <PremiumBalance label="Meu saldo" value={balance?.balance ?? 0} />
      </section>

      {!entry && profile.role === "super_admin" ? (
        <section className="mb-6 surface border-cupGold/25 bg-cupGold/10 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cupGold">
                Participar como jogador
              </p>
              <p className="mt-1 text-sm text-ink/75">
                Como Super Admin voce ve a gestao do Premium, mas precisa aceitar para apostar como participante.
              </p>
            </div>
            <form action={acceptPremium}>
              <button className="btn-primary bg-cupGold text-pitch hover:bg-yellow-200">
                <Star size={18} />
                Aceito participar
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {profile.role === "super_admin" ? (
        <section className="mb-6 grid gap-4 lg:grid-cols-[18rem_1fr]">
          <PremiumBalance label="Pote em jogo" value={totalPot} />
          <div className="surface overflow-hidden border-cupGold/20">
            <div className="border-b border-line px-4 py-3 text-sm font-bold uppercase tracking-wide text-cupGold/80">
              Saldos por jogador
            </div>
            <div className="divide-y divide-line">
              {balanceRows.map((row) => (
                <div className="flex items-center justify-between gap-3 px-4 py-3" key={row.user_id}>
                  <span className="font-semibold">{row.name}</span>
                  <span className={Number(row.balance) >= 0 ? "font-black text-mint" : "font-black text-red-200"}>
                    {formatEuro(row.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {summaryRows.map((match) => {
          const prediction = predictionsByMatch.get(match.match_id);
          const locked = !canPredict({ status: match.status, bid_closes_at: match.bid_closes_at });
          const noWinners = match.status === "finished" && match.winners_count === 0 && match.predictions_count > 0;
          const playerResult =
            prediction && match.status === "finished"
              ? noWinners
                ? null
                : prediction.home_score === match.home_score && prediction.away_score === match.away_score
                  ? Number(match.payout_per_winner) - Number(prediction.stake_amount)
                  : -Number(prediction.stake_amount)
              : null;

          return (
            <article className="surface overflow-hidden border-cupGold/25" key={match.match_id}>
              <div className="h-1 bg-gradient-to-r from-cupGold via-grass to-cupRed" />
              <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/60">
                    <span>{formatKickoff(match.starts_at)}</span>
                    <span className="rounded bg-cupGold/10 px-2 py-1 text-cupGold">
                      {formatBidCountdown(match.bid_closes_at)}
                    </span>
                    {match.has_accumulated_pot ? (
                      <span className="rounded bg-cupGold/20 px-2 py-1 text-cupGold">
                        Acumulado
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-black">
                    {match.home_team} <span className="text-ink/40">x</span> {match.away_team}
                  </h2>
                </div>

                <div className="grid gap-1 text-left sm:text-right">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink/60">Pote</span>
                  <span className="text-2xl font-black text-cupGold">{formatEuro(match.pot_amount)}</span>
                  {match.has_accumulated_pot ? (
                    <span className="text-xs text-cupGold/70">
                      inclui {formatEuro(match.accumulated_pot)} acumulado
                    </span>
                  ) : null}
                  <span className="text-xs text-ink/60">
                    {match.predictions_count} apostas · {match.winners_count} vencedores
                  </span>
                </div>
              </div>

              {prediction ? (
                <div className="mt-4 rounded-md border border-cupGold/25 bg-cupGold/10 px-3 py-2 text-sm text-amber-50">
                  Sua aposta premium:{" "}
                  <strong>
                    {prediction.home_score} x {prediction.away_score}
                  </strong>
                </div>
              ) : null}

              {match.status === "finished" ? (
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink/70">
                  <span className="rounded-md bg-white/5 px-3 py-1">
                    Resultado: {match.home_score} x {match.away_score}
                  </span>
                  {match.winners_count > 0 ? (
                    <span className="rounded-md bg-mint/10 px-3 py-1 text-mint">
                      Premio por vencedor: {formatEuro(match.payout_per_winner)}
                    </span>
                  ) : noWinners ? (
                    <span className="rounded-md bg-cupGold/10 px-3 py-1 text-cupGold">
                      Pote acumulado para o proximo jogo
                    </span>
                  ) : null}
                  {playerResult !== null ? (
                    <span
                      className={
                        playerResult >= 0
                          ? "rounded-md bg-mint/10 px-3 py-1 font-bold text-mint"
                          : "rounded-md bg-red-500/10 px-3 py-1 font-bold text-red-100"
                      }
                    >
                      Performance: {formatEuro(playerResult)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {match.status !== "finished" && (!locked || prediction) ? (
                <PremiumPredictionForm match={match} prediction={prediction} />
              ) : null}

              <Link className="btn-secondary mt-4 border-cupGold/30 text-cupGold" href={`/premium/${match.match_id}`}>
                <Eye size={17} />
                Ver detalhes
              </Link>
              </div>
            </article>
          );
        })}

        {summaryRows.length === 0 ? (
          <div className="surface p-8 text-center text-ink/70">Nenhum jogo premium cadastrado.</div>
        ) : null}
      </section>
    </AppShell>
  );
}

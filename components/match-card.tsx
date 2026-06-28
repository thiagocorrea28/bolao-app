import { CheckCircle2, Crown, Lock, Timer } from "lucide-react";
import type { Match, Prediction } from "@/lib/types";
import { formatBidCountdown, formatKickoff } from "@/lib/utils";
import { PredictionForm } from "@/components/prediction-form";
import { MatchPredictionsModal } from "@/components/match-predictions-modal";

export function MatchCard({
  match,
  prediction,
  date,
  hasPremiumEntry
}: {
  match: Match;
  prediction?: Prediction;
  date: string;
  hasPremiumEntry?: boolean;
}) {
  const closed = match.status === "finished" || new Date(match.bid_closes_at).getTime() <= Date.now();

  return (
    <article className="surface overflow-hidden">
      <div className="cup-stripe-card h-1" /> 
      <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/70">
            <span className="rounded-md border border-line bg-white/5 px-2 py-1">
              Matchday · {formatKickoff(match.starts_at)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-cupBlue/25 bg-cupBlue/10 px-2 py-1 text-cupBlue">
              <Timer size={13} />
              {formatBidCountdown(match.bid_closes_at)}
            </span>
            {match.is_premium ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-cupGold/30 bg-cupGold/10 px-2 py-1 text-cupGold">
                <Crown size={13} />
                Premium
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-black">{match.home_team}</h2>
            {match.status === "finished" && match.home_score !== null && match.away_score !== null ? (
              <span className="inline-flex w-16 shrink-0 justify-center rounded-md border border-mint/30 bg-mint/10 px-3 py-1 text-sm font-black text-mint sm:inline-flex">
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="hidden w-12 shrink-0 justify-center rounded-md border border-line bg-white/5 px-3 py-1 text-sm font-black text-ink/50 sm:inline-flex">
                VS
              </span>
            )}
            <h2 className="text-2xl font-black">{match.away_team}</h2>
          </div>
        </div>

        <span
          className={
            match.status === "finished"
              ? "inline-flex items-center gap-2 rounded-md border border-mint/25 bg-mint/10 px-3 py-2 text-sm font-black text-mint"
              : closed
                ? "inline-flex items-center gap-2 rounded-md border border-cupRed/30 bg-cupRed/10 px-3 py-2 text-sm font-black text-red-100"
                : "inline-flex items-center gap-2 rounded-md border border-grass/30 bg-grass/10 px-3 py-2 text-sm font-black text-mint"
          }
        >
          {match.status === "finished" ? <CheckCircle2 size={17} /> : closed ? <Lock size={17} /> : <Timer size={17} />}
          {match.status === "finished" ? "Finalizado" : closed ? "Fechado" : "Aberto"}
        </span>
      </div>

      {prediction ? (
        <div className="mt-4 rounded-md border border-cupBlue/20 bg-cupBlue/10 px-3 py-2 text-sm text-ink/80">
          Sua aposta:{" "}
          <strong className="text-ink">
            {prediction.home_score} x {prediction.away_score}
          </strong>
          {match.status === "finished" ? (
            <span className="ml-2 text-mint">+{prediction.points} pts</span>
          ) : null}
        </div>
      ) : null}

      {match.status !== "finished" ? (
        <PredictionForm
          key={match.id}
          hasPremiumEntry={hasPremiumEntry}
          isPremiumMatch={match.is_premium}
          date={date}
          match={match}
          prediction={prediction}
        />
      ) : null}

      <MatchPredictionsModal matchId={match.id} matchFinished={match.status === "finished"} />
      </div>
    </article>
  );
}

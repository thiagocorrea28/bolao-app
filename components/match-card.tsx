import { Crown } from "lucide-react";
import type { Match, Prediction } from "@/lib/types";
import { formatBidCountdown, formatKickoff } from "@/lib/utils";
import { PredictionForm } from "@/components/prediction-form";

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
  return (
    <article className="surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/60">
            <span>{formatKickoff(match.starts_at)}</span>
            <span className="rounded bg-white/5 px-2 py-1 text-ink/70">
              {formatBidCountdown(match.bid_closes_at)}
            </span>
            {match.is_premium ? (
              <span className="inline-flex items-center gap-1 rounded bg-mint/10 px-2 py-1 text-mint">
                <Crown size={13} />
                Premium
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-xl font-black">
            {match.home_team} <span className="text-ink/40">x</span> {match.away_team}
          </h2>
        </div>

        
      </div>

      {prediction ? (
        <div className="mt-4 rounded-md border border-line bg-black/20 px-3 py-2 text-sm text-ink/75">
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
    </article>
  );
}

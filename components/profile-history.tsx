"use client";

import { useState } from "react";
import { Target, Trophy } from "lucide-react";
import type { Match, Prediction } from "@/lib/types";
import { formatKickoff } from "@/lib/utils";

type HistoryRow = Prediction & { matches: Match };

type Filter = "all" | "open" | "exact";

export function ProfileHistory({ rows }: { rows: HistoryRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const exactCount = rows.filter((r) => r.is_exact_score).length;
  const openCount = rows.filter((r) => r.matches.status !== "finished").length;

  const displayed =
    filter === "exact"
      ? rows.filter((r) => r.is_exact_score)
      : filter === "open"
        ? rows.filter((r) => r.matches.status !== "finished")
        : rows;

  const pillBase = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors";
  const pillActive = "bg-white/10 text-ink";
  const pillInactive = "text-ink/50 hover:text-ink/80";

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`${pillBase} ${filter === "all" ? pillActive : pillInactive}`}>
          Todos ({rows.length})
        </button>
        {openCount > 0 && (
          <button onClick={() => setFilter("open")} className={`${pillBase} ${filter === "open" ? "bg-cupBlue/20 text-cupBlue border border-cupBlue/30" : pillInactive}`}>
            Em aberto ({openCount})
          </button>
        )}
        {exactCount > 0 && (
          <button onClick={() => setFilter("exact")} className={`${pillBase} ${filter === "exact" ? "bg-cupGold/20 text-cupGold border border-cupGold/30" : pillInactive}`}>
            <Target size={12} />
            Placar exato ({exactCount})
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {displayed.map((item) => {
          const advancingTeam =
            item.matches.is_knockout && item.predicted_winner
              ? item.predicted_winner === "home"
                ? item.matches.home_team
                : item.matches.away_team
              : null;

          return (
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
                  {advancingTeam ? (
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-cupGold/80">
                      <Trophy size={11} />
                      {advancingTeam}
                    </p>
                  ) : null}
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
                      <span className="inline-flex items-center gap-1 rounded-md bg-cupGold/15 px-3 py-1 font-bold text-cupGold">
                        <Target size={12} />
                        Placar exato
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="rounded-md bg-white/5 px-3 py-1">Jogo ainda não finalizado</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

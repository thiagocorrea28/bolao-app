"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import type { Match, Prediction } from "@/lib/types";
import { formatKickoff } from "@/lib/utils";

type HistoryRow = Prediction & { matches: Match };

export function ProfileHistory({ rows }: { rows: HistoryRow[] }) {
  const [onlyExact, setOnlyExact] = useState(false);

  const exactCount = rows.filter((r) => r.is_exact_score).length;
  const displayed = onlyExact ? rows.filter((r) => r.is_exact_score) : rows;

  return (
    <>
      {exactCount > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setOnlyExact(false)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              !onlyExact
                ? "bg-white/10 text-ink"
                : "text-ink/50 hover:text-ink/80"
            }`}
          >
            Todos ({rows.length})
          </button>
          <button
            onClick={() => setOnlyExact(true)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              onlyExact
                ? "bg-cupGold/20 text-cupGold border border-cupGold/30"
                : "text-ink/50 hover:text-ink/80"
            }`}
          >
            <Target size={12} />
            Placar exato ({exactCount})
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {displayed.map((item) => (
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
                    <span className="inline-flex items-center gap-1 rounded-md bg-cupGold/15 px-3 py-1 font-bold text-cupGold">
                      <Target size={12} />
                      Placar exato
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="rounded-md bg-white/5 px-3 py-1">Jogo ainda nao finalizado</span>
              )}
            </div>
          </article>
        ))}

        {displayed.length === 0 ? (
          <div className="surface p-8 text-center text-ink/70">Nenhum placar exato ainda.</div>
        ) : null}
      </div>
    </>
  );
}

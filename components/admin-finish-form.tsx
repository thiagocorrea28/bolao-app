"use client";

import { useState } from "react";
import { finishMatch } from "@/lib/actions";
import type { Match } from "@/lib/types";

export function AdminFinishForm({ match }: { match: Match }) {
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? "");
  const [winner, setWinner] = useState<"home" | "away" | null>(match.winner ?? null);

  const isDraw =
    match.is_knockout &&
    homeScore !== "" &&
    awayScore !== "" &&
    homeScore === awayScore;

  return (
    <form action={finishMatch} className="grid gap-2">
      <input name="id" type="hidden" value={match.id} />
      {isDraw && winner ? <input name="winner" type="hidden" value={winner} /> : null}

      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
        <label className="grid gap-1 text-xs font-semibold text-ink/70">
          {match.home_team}
          <input
            className="field text-center"
            value={homeScore}
            onChange={(e) => { setHomeScore(e.target.value); setWinner(null); }}
            min={0}
            name="home_score"
            required
            type="number"
          />
        </label>
        <span className="pb-2 text-ink/50">x</span>
        <label className="grid gap-1 text-xs font-semibold text-ink/70">
          {match.away_team}
          <input
            className="field text-center"
            value={awayScore}
            onChange={(e) => { setAwayScore(e.target.value); setWinner(null); }}
            min={0}
            name="away_score"
            required
            type="number"
          />
        </label>
        <button className="btn-primary self-end" disabled={isDraw && winner === null}>
          Finalizar
        </button>
      </div>

      {isDraw ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWinner("home")}
            className={`rounded-md border px-3 py-2 text-xs font-bold transition-colors ${
              winner === "home"
                ? "border-cupGold bg-cupGold/20 text-cupGold"
                : "border-line bg-black/20 text-ink/70 hover:border-cupGold/40"
            }`}
          >
            Avança: {match.home_team}
          </button>
          <button
            type="button"
            onClick={() => setWinner("away")}
            className={`rounded-md border px-3 py-2 text-xs font-bold transition-colors ${
              winner === "away"
                ? "border-cupGold bg-cupGold/20 text-cupGold"
                : "border-line bg-black/20 text-ink/70 hover:border-cupGold/40"
            }`}
          >
            Avança: {match.away_team}
          </button>
        </div>
      ) : null}
    </form>
  );
}

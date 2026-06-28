"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Save, Trophy } from "lucide-react";
import { savePrediction } from "@/lib/actions";
import type { Match, Prediction } from "@/lib/types";
import { canPredict } from "@/lib/utils";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full sm:w-auto" disabled={disabled || pending}>
      <Save size={17} />
      {pending ? "Salvando" : disabled ? "apostas encerradas" : "Salvar aposta"}
    </button>
  );
}

export function PredictionForm({
  match,
  prediction,
  date,
  isPremiumMatch,
  hasPremiumEntry
}: {
  match: Match;
  prediction?: Prediction;
  date: string;
  isPremiumMatch?: boolean;
  hasPremiumEntry?: boolean;
}) {
  const locked = !canPredict(match);

  const [homeScore, setHomeScore] = useState(prediction?.home_score?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(prediction?.away_score?.toString() ?? "");
  const [predictedWinner, setPredictedWinner] = useState<"home" | "away" | null>(
    prediction?.predicted_winner ?? null
  );

  const isDraw =
    match.is_knockout &&
    homeScore !== "" &&
    awayScore !== "" &&
    homeScore === awayScore;

  const missingWinner = isDraw && predictedWinner === null;

  return (
    <form action={savePrediction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="date" value={date} />
      {isDraw && predictedWinner ? (
        <input type="hidden" name="predicted_winner" value={predictedWinner} />
      ) : null}

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 rounded-lg border border-line bg-black/20 p-3">
        <label className="grid gap-1 text-xs font-semibold text-ink/70">
          {match.home_team}
          <input
            className="field text-center text-lg font-black"
            value={homeScore}
            onChange={(e) => {
              setHomeScore(e.target.value);
              setPredictedWinner(null);
            }}
            disabled={locked}
            inputMode="numeric"
            min={0}
            name="home_score"
            required
            type="number"
          />
        </label>
        <span className="pb-2 text-sm font-black text-cupGold">x</span>
        <label className="grid gap-1 text-xs font-semibold text-ink/70">
          {match.away_team}
          <input
            className="field text-center text-lg font-black"
            value={awayScore}
            onChange={(e) => {
              setAwayScore(e.target.value);
              setPredictedWinner(null);
            }}
            disabled={locked}
            inputMode="numeric"
            min={0}
            name="away_score"
            required
            type="number"
          />
        </label>
      </div>

      {isDraw ? (
        <div className="rounded-lg border border-cupGold/30 bg-cupGold/10 p-3 sm:col-span-2">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-cupGold">
            <Trophy size={12} />
            Quem avança nos penaltis?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPredictedWinner("home")}
              className={`rounded-md border px-3 py-2 text-sm font-bold transition-colors ${
                predictedWinner === "home"
                  ? "border-cupGold bg-cupGold/20 text-cupGold"
                  : "border-line bg-black/20 text-ink/70 hover:border-cupGold/40 hover:text-ink"
              }`}
            >
              {match.home_team}
            </button>
            <button
              type="button"
              onClick={() => setPredictedWinner("away")}
              className={`rounded-md border px-3 py-2 text-sm font-bold transition-colors ${
                predictedWinner === "away"
                  ? "border-cupGold bg-cupGold/20 text-cupGold"
                  : "border-line bg-black/20 text-ink/70 hover:border-cupGold/40 hover:text-ink"
              }`}
            >
              {match.away_team}
            </button>
          </div>
          {missingWinner ? (
            <p className="mt-2 text-xs text-red-400">Selecione quem avança para salvar a aposta.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col items-stretch justify-end gap-2 sm:items-end">
        <SubmitButton disabled={locked || missingWinner} />
      </div>

      {isPremiumMatch && hasPremiumEntry && !locked ? (
        <label className="flex items-center gap-2 rounded-md border border-cupGold/30 bg-cupGold/10 px-3 py-2 text-sm font-semibold text-cupGold sm:col-span-2">
          <input className="h-4 w-4 accent-cupGold" name="use_for_premium" type="checkbox" />
          Utilizar este placar para o Bolão Premium
        </label>
      ) : null}
      {isPremiumMatch && !hasPremiumEntry && !locked ? (
        <div className="rounded-md border border-cupGold/30 bg-cupGold/10 px-3 py-2 text-sm text-cupGold sm:col-span-2">
          Para utilizar este placar no Bolão Premium,{" "}
          <Link className="font-bold underline underline-offset-4" href="/premium">
            aceite participar
          </Link>
          .
        </div>
      ) : null}
    </form>
  );
}

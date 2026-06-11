"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
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

  return (
    <form action={savePrediction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="date" value={date} />
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="grid gap-1 text-xs font-semibold text-ink/70">
          {match.home_team}
          <input
            className="field text-center text-base font-black"
            defaultValue={prediction?.home_score ?? ""}
            disabled={locked}
            inputMode="numeric"
            min={0}
            name="home_score"
            required
            type="number"
          />
        </label>
        <span className="pb-2 text-sm text-ink/50">x</span>
        <label className="grid gap-1 text-xs font-semibold text-ink/70">
          {match.away_team}
          <input
            className="field text-center text-base font-black"
            defaultValue={prediction?.away_score ?? ""}
            disabled={locked}
            inputMode="numeric"
            min={0}
            name="away_score"
            required
            type="number"
          />
        </label>
      </div>
      <div className="flex flex-col items-stretch justify-end gap-2 sm:items-end">
        <SubmitButton disabled={locked} />
      </div>
      {isPremiumMatch && hasPremiumEntry && !locked ? (
        <label className="flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100 sm:col-span-2">
          <input className="h-4 w-4 accent-amber-300" name="use_for_premium" type="checkbox" />
          Utilizar este placar para o Bolão Premium
        </label>
      ) : null}
      {isPremiumMatch && !hasPremiumEntry && !locked ? (
        <div className="rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100 sm:col-span-2">
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

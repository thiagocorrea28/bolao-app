"use client";

import { useFormStatus } from "react-dom";
import { Save, XCircle } from "lucide-react";
import { cancelPremiumPrediction, savePremiumPrediction } from "@/lib/actions";
import type { PremiumPrediction, PremiumMatchSummary } from "@/lib/types";
import { canPredict } from "@/lib/utils";

function SaveButton({ disabled, hasPrediction }: { disabled: boolean; hasPrediction: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary bg-amber-300 text-pitch hover:bg-amber-200" disabled={disabled || pending}>
      <Save size={17} />
      {pending ? "Salvando" : hasPrediction ? "Atualizar premium" : "Apostar 2,00€"}
    </button>
  );
}

function CancelButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn-secondary border-red-400/30 text-red-100 hover:bg-red-500/10" disabled={disabled || pending}>
      <XCircle size={17} />
      {pending ? "Cancelando" : "Remover aposta"}
    </button>
  );
}

export function PremiumPredictionForm({
  match,
  prediction
}: {
  match: PremiumMatchSummary;
  prediction?: PremiumPrediction;
}) {
  const locked = !canPredict({ status: match.status, bid_closes_at: match.bid_closes_at });

  return (
    <div className="mt-4 grid gap-3">
      <form
        action={savePremiumPrediction}
        className="grid gap-3 sm:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          if (!prediction && !window.confirm("Esta aposta custa 2,00€. Deseja confirmar?")) {
            event.preventDefault();
          }
        }}
      >
        <input name="match_id" type="hidden" value={match.match_id} />
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
          <span className="pb-2 text-sm text-amber-100/70">x</span>
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
        <div className="flex items-end">
          <SaveButton disabled={locked} hasPrediction={Boolean(prediction)} />
        </div>
      </form>

      {prediction && !locked ? (
        <form
          action={cancelPremiumPrediction}
          onSubmit={(event) => {
            if (!window.confirm("Remover esta aposta premium e devolver a entrada deste jogo?")) {
              event.preventDefault();
            }
          }}
        >
          <input name="match_id" type="hidden" value={match.match_id} />
          <CancelButton disabled={locked} />
        </form>
      ) : null}
    </div>
  );
}

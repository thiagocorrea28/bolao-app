"use client";

import { useState, useTransition } from "react";
import { Users, X } from "lucide-react";
import { getMatchPredictions } from "@/lib/actions";

type Prediction = {
  home_score: number;
  away_score: number;
  points: number | null;
  name: string;
};

export function MatchPredictionsModal({
  matchId,
  matchFinished
}: {
  matchId: string;
  matchFinished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    startTransition(async () => {
      const data = await getMatchPredictions(matchId);
      setPredictions(data);
    });
  }

  return (
    <>
      <button className="btn-secondary mt-3 w-full text-sm" onClick={handleOpen} type="button">
        <Users size={15} />
        Ver apostas
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="surface w-full max-w-md rounded-t-2xl p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black">Apostas</h2>
              <button
                className="rounded-md p-1 text-ink/50 hover:text-ink"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {isPending ? (
              <p className="py-6 text-center text-sm text-ink/50">A carregar…</p>
            ) : predictions.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/50">Nenhuma aposta registada.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {predictions.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b border-line py-2 last:border-0"
                  >
                    <span className="text-sm font-semibold">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-line bg-white/5 px-2 py-0.5 text-sm font-black tabular-nums">
                        {p.home_score} x {p.away_score}
                      </span>
                      {matchFinished && p.points != null ? (
                        <span className="w-14 text-right text-sm font-bold text-mint">
                          +{p.points} pts
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

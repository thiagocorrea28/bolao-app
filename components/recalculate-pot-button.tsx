"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { recalculateAccumulatedPot } from "@/lib/actions";

export function RecalculatePotButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Recalcular o pote acumulado de todos os jogos premium? O valor será redistribuído cronologicamente.")) return;
    startTransition(() => recalculateAccumulatedPot());
  }

  return (
    <button
      className="btn-secondary inline-flex items-center gap-2"
      disabled={pending}
      onClick={handleClick}
      type="button"
    >
      <RefreshCw size={15} className={pending ? "animate-spin" : ""} />
      {pending ? "Recalculando…" : "Recalcular pote premium"}
    </button>
  );
}

import { formatEuro } from "@/lib/utils";

export function PremiumBalance({ label, value }: { label: string; value: number | string }) {
  const amount = typeof value === "string" ? Number(value) : value;
  const tone = amount >= 0 ? "text-mint" : "text-red-200";

  return (
    <div className="surface border-amber-300/20 bg-amber-300/10 p-4">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-100/70">{label}</p>
      <p className={`mt-1 text-3xl font-black ${tone}`}>{formatEuro(amount)}</p>
    </div>
  );
}

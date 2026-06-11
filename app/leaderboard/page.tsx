import Link from "next/link";
import { redirect } from "next/navigation";
import { Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow, Profile } from "@/lib/types";

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: rows = [] } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false })
    .order("name", { ascending: true })
    .returns<LeaderboardRow[]>();
  const leaderboardRows = rows ?? [];

  return (
    <AppShell profile={profile}>
      <section className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-cupGold">Ranking do torneio</p>
        <h1 className="mt-1 text-3xl font-black">Leaderboard</h1>
      </section>

      <div className="surface overflow-hidden">
        {leaderboardRows.length > 0 ? (
          <div className="divide-y divide-line">
            {leaderboardRows.map((row, index) => (
              <Link
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 transition hover:bg-white/5"
                href={`/profile/${row.user_id}`}
                key={row.user_id}
              >
                <span
                  className={
                    index === 0
                      ? "grid h-11 w-11 place-items-center rounded-md border border-cupGold/30 bg-cupGold/20 font-black text-cupGold"
                      : index < 3
                        ? "grid h-11 w-11 place-items-center rounded-md border border-cupBlue/25 bg-cupBlue/10 font-black text-cupBlue"
                        : "grid h-11 w-11 place-items-center rounded-md border border-line bg-white/5 font-black"
                  }
                >
                  {index === 0 ? <Trophy size={20} /> : index < 3 ? <Medal size={19} /> : index + 1}
                </span>
                <span>
                  <strong className="block">{row.name}</strong>
                  <span className="text-sm text-ink/60">
                    {row.exact_scores} placares exatos · {row.predictions_count} apostas
                  </span>
                </span>
                <span className="rounded-md bg-grass/10 px-3 py-2 text-right text-2xl font-black text-mint">
                  {row.total_points}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-ink/70">Sem pontuacao ainda.</div>
        )}
      </div>
    </AppShell>
  );
}

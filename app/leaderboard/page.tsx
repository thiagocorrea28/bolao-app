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
        <p className="text-sm font-bold uppercase tracking-wide text-mint">Pontuacao geral</p>
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
                <span className="grid h-10 w-10 place-items-center rounded-md bg-white/5 font-black">
                  {index === 0 ? <Trophy size={20} className="text-mint" /> : <Medal size={19} />}
                </span>
                <span>
                  <strong className="block">{row.name}</strong>
                  <span className="text-sm text-ink/60">
                    {row.exact_scores} placares exatos · {row.predictions_count} apostas
                  </span>
                </span>
                <span className="text-right text-2xl font-black">{row.total_points}</span>
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

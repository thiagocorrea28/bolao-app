import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { ProfileHistory } from "@/components/profile-history";
import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile } from "@/lib/types";

type HistoryRow = Prediction & {
  matches: Match;
};

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: viewer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single<Profile>();

  if (!profile) {
    notFound();
  }

  const { data: history = [] } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", params.id)
    .returns<HistoryRow[]>();
  const historyRows = (history ?? []).sort(
    (a, b) => new Date(a.matches.starts_at).getTime() - new Date(b.matches.starts_at).getTime()
  );

  return (
    <AppShell profile={viewer}>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mint">Historico de apostas</p>
          <h1 className="mt-1 text-3xl font-black">{profile.name}</h1>
        </div>
        <BackButton />
      </section>

      <ProfileHistory rows={historyRows} />
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { CalendarPlus, FileUp, RotateCcw, Trash2 } from "lucide-react";
import { AdminCollapsibleSection } from "@/components/admin-collapsible-section";
import { AppShell } from "@/components/app-shell";
import {
  createMatch,
  deleteMatch,
  finishMatch,
  importMatchesCsv,
  reopenMatch,
  updateMatch
} from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import type { Match, Profile } from "@/lib/types";

function datetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminPage() {
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

  if (profile?.role !== "super_admin") {
    redirect("/");
  }

  const { data: matches = [] } = await supabase
    .from("matches")
    .select("*")
    .order("starts_at", { ascending: true })
    .returns<Match[]>();

  const { data: premiumPredictions = [] } = await supabase
    .from("premium_predictions")
    .select("match_id")
    .eq("status", "active")
    .returns<Array<{ match_id: string }>>();

  const premiumPredictionCounts = premiumPredictions.reduce<Record<string, number>>((acc, item) => {
    acc[item.match_id] = (acc[item.match_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell profile={profile}>
      <section className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-mint">Super Admin</p>
        <h1 className="mt-1 text-3xl font-black">Gerenciar jogos</h1>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.7fr)]">
        <AdminCollapsibleSection
          icon={<CalendarPlus size={20} className="text-mint" />}
          title="Novo jogo"
        >
          <form action={createMatch} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Time da casa
              <input className="field" name="home_team" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Visitante
              <input className="field" name="away_team" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Data e hora
              <input className="field" name="starts_at" required type="datetime-local" />
            </label>
            <label className="flex items-center gap-3 rounded-md border border-line bg-black/20 px-3 py-2 text-sm font-semibold">
              <input className="h-4 w-4 accent-grass" name="is_premium" type="checkbox" />
              Jogo premium
            </label>
            <button className="btn-primary sm:col-span-2">Cadastrar jogo</button>
          </form>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          icon={<FileUp size={20} className="text-mint" />}
          title="Importar CSV"
        >
          <form action={importMatchesCsv} className="grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Ficheiro CSV
              <input
                accept=".csv,text/csv"
                className="field file:mr-3 file:rounded-md file:border-0 file:bg-grass file:px-3 file:py-2 file:text-sm file:font-bold file:text-pitch"
                name="csv_file"
                required
                type="file"
              />
            </label>
            <pre className="overflow-x-auto rounded-md border border-line bg-black/20 p-3 text-xs text-ink/70">
              {"home_team,away_team,starts_at,is_premium\nBrasil,Argentina,2026-06-15T20:00:00+01:00,false"}
            </pre>
            <button className="btn-primary">
              <FileUp size={17} />
              Importar jogos
            </button>
          </form>
        </AdminCollapsibleSection>
      </div>

      <section className="mt-6 grid gap-4">
        {matches.map((match) => (
          <article className="surface p-4" key={match.id}>
            {premiumPredictionCounts[match.id] ? (
              <div className="mb-3 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-50">
                {premiumPredictionCounts[match.id]} apostas premium ativas. Este jogo nao pode ser apagado nem deixar de ser premium.
              </div>
            ) : null}
            <form action={updateMatch} className="grid gap-3 lg:grid-cols-[1fr_1fr_15rem_8rem_auto]">
              <input name="id" type="hidden" value={match.id} />
              <label className="grid gap-2 text-sm font-semibold">
                Casa
                <input className="field" name="home_team" required defaultValue={match.home_team} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Visitante
                <input className="field" name="away_team" required defaultValue={match.away_team} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Inicio
                <input
                  className="field"
                  name="starts_at"
                  required
                  type="datetime-local"
                  defaultValue={datetimeLocalValue(match.starts_at)}
                />
              </label>
              <label className="flex items-center gap-2 self-end rounded-md border border-line bg-black/20 px-3 py-2 text-sm font-semibold">
                {premiumPredictionCounts[match.id] && match.is_premium ? (
                  <>
                    <input name="is_premium" type="hidden" value="on" />
                    <input
                      className="h-4 w-4 accent-grass"
                      type="checkbox"
                      checked
                      disabled
                      readOnly
                    />
                  </>
                ) : (
                  <input
                    className="h-4 w-4 accent-grass"
                    name="is_premium"
                    type="checkbox"
                    defaultChecked={match.is_premium}
                  />
                )}
                Premium
              </label>
              <button className="btn-secondary self-end">Salvar</button>
            </form>

            <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-[1fr_auto]">
              {match.status === "finished" ? (
                <form action={reopenMatch} className="flex flex-wrap items-end gap-2">
                  <input name="id" type="hidden" value={match.id} />
                  <div className="rounded-md border border-line bg-black/20 px-3 py-2 text-sm text-ink/70">
                    Resultado final:{" "}
                    <strong className="text-ink">
                      {match.home_score} x {match.away_score}
                    </strong>
                  </div>
                  <button
                    className="btn-secondary border-amber-300/30 text-amber-100 hover:bg-amber-300/10"
                    disabled={Date.now() >= new Date(match.bid_closes_at).getTime()}
                  >
                    <RotateCcw size={16} />
                    Reabrir
                  </button>
                </form>
              ) : (
                <form action={finishMatch} className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
                  <input name="id" type="hidden" value={match.id} />
                  <label className="grid gap-1 text-xs font-semibold text-ink/70">
                    {match.home_team}
                    <input
                      className="field text-center"
                      defaultValue={match.home_score ?? ""}
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
                      defaultValue={match.away_score ?? ""}
                      min={0}
                      name="away_score"
                      required
                      type="number"
                    />
                  </label>
                  <button className="btn-primary">Finalizar</button>
                </form>
              )}

              <div className="flex flex-wrap gap-2 md:justify-self-end">
                <form action={deleteMatch}>
                  <input name="id" type="hidden" value={match.id} />
                  <button
                    className="btn-secondary border-red-400/30 text-red-100 hover:bg-red-500/10"
                    disabled={Boolean(premiumPredictionCounts[match.id])}
                  >
                    <Trash2 size={16} />
                    Apagar
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

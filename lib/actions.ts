"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Informe um placar valido.");
  }
  return value;
}

async function getProfile() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Perfil nao encontrado.");
  }

  return { supabase, user, profile };
}

async function requireAdmin() {
  const context = await getProfile();
  if (context.profile.role !== "super_admin") {
    redirect("/");
  }
  return context;
}

export async function signUp(formData: FormData) {
  const supabase = createClient();
  const name = formString(formData, "name");
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");

  if (!name || !email || password.length < 6) {
    redirect("/signup?error=Preencha+nome,+email+e+senha+com+6+caracteres");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3080"}/auth/callback`
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Cadastro realizado. Confira seu email para validar a conta."
    )}`
  );
}

export async function signIn(formData: FormData) {
  const supabase = createClient();
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function savePrediction(formData: FormData) {
  const { supabase, user } = await getProfile();
  const matchId = formString(formData, "match_id");
  const date = formString(formData, "date");
  const homeScore = formNumber(formData, "home_score");
  const awayScore = formNumber(formData, "away_score");
  const useForPremium = formData.get("use_for_premium") === "on";

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (useForPremium) {
    const { error: premiumError } = await supabase.from("premium_predictions").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        stake_amount: 2,
        status: "active"
      },
      { onConflict: "user_id,match_id" }
    );

    if (premiumError) {
      throw new Error(premiumError.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/premium");
  revalidatePath("/admin");
  if (date) {
    redirect(`/?date=${date}`);
  }
  redirect("/");
}

export async function acceptPremium() {
  const { supabase, user } = await getProfile();

  const { data: existingEntry } = await supabase
    .from("premium_entries")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingEntry) {
    redirect("/premium");
  }

  const { error } = await supabase.from("premium_entries").insert({ user_id: user.id });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/premium");
  redirect("/premium");
}

export async function savePremiumPrediction(formData: FormData) {
  const { supabase, user } = await getProfile();
  const matchId = formString(formData, "match_id");
  const homeScore = formNumber(formData, "home_score");
  const awayScore = formNumber(formData, "away_score");

  const { error } = await supabase.from("premium_predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      stake_amount: 2,
      status: "active"
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/premium");
  revalidatePath(`/premium/${matchId}`);
  revalidatePath("/admin");
  redirect("/premium");
}

export async function cancelPremiumPrediction(formData: FormData) {
  const { supabase, user } = await getProfile();
  const matchId = formString(formData, "match_id");

  const { error } = await supabase
    .from("premium_predictions")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("match_id", matchId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/premium");
  revalidatePath(`/premium/${matchId}`);
  revalidatePath("/admin");
  redirect("/premium");
}

export async function createMatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const homeTeam = formString(formData, "home_team");
  const awayTeam = formString(formData, "away_team");
  const startsAt = formString(formData, "starts_at");
  const isPremium = formData.get("is_premium") === "on";

  if (!homeTeam || !awayTeam || !startsAt) {
    throw new Error("Preencha os dados do jogo.");
  }

  const { error } = await supabase.from("matches").insert({
    home_team: homeTeam,
    away_team: awayTeam,
    starts_at: new Date(startsAt).toISOString(),
    is_premium: isPremium
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/premium");
}

export async function updateMatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formString(formData, "id");
  const homeTeam = formString(formData, "home_team");
  const awayTeam = formString(formData, "away_team");
  const startsAt = formString(formData, "starts_at");
  const isPremium = formData.get("is_premium") === "on";

  const { error } = await supabase
    .from("matches")
    .update({
      home_team: homeTeam,
      away_team: awayTeam,
      starts_at: new Date(startsAt).toISOString(),
      is_premium: isPremium
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/premium");
  revalidatePath(`/premium/${id}`);
}

export async function finishMatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formString(formData, "id");
  const homeScore = formNumber(formData, "home_score");
  const awayScore = formNumber(formData, "away_score");

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished"
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/premium");
  revalidatePath(`/premium/${id}`);
}

export async function reopenMatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formString(formData, "id");

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("bid_closes_at")
    .eq("id", id)
    .single();

  if (matchError || !match) {
    throw new Error(matchError?.message || "Jogo nao encontrado.");
  }

  if (Date.now() >= new Date(match.bid_closes_at).getTime()) {
    throw new Error("Nao e possivel reabrir: apostas ja encerraram.");
  }

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: null,
      away_score: null,
      status: "open"
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/premium");
  revalidatePath(`/premium/${id}`);
}

export async function deleteMatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formString(formData, "id");

  const { error } = await supabase.from("matches").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/premium");
  revalidatePath(`/premium/${id}`);
}

function detectCsvDelimiter(csv: string) {
  const firstLine = csv.split(/\r?\n/).find((line) => line.trim());
  if (!firstLine) {
    return ",";
  }

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsv(csv: string) {
  const delimiter = detectCsvDelimiter(csv);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

export async function importMatchesCsv(formData: FormData) {
  const { supabase } = await requireAdmin();
  const csvFile = formData.get("csv_file");
  let csv = formString(formData, "csv");

  if (csvFile instanceof File && csvFile.size > 0) {
    if (!csvFile.name.toLowerCase().endsWith(".csv")) {
      throw new Error("Envie um ficheiro .csv.");
    }

    if (csvFile.size > 1024 * 1024) {
      throw new Error("O CSV deve ter no maximo 1 MB.");
    }

    csv = await csvFile.text();
  }

  if (!csv) {
    throw new Error("Selecione um ficheiro CSV.");
  }

  const rows = parseCsv(csv);
  const [header, ...records] = rows;

  if (!header || records.length === 0) {
    throw new Error("CSV vazio.");
  }

  const normalizedHeader = header.map((name) =>
    name
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
  );
  const indexes: Record<string, number> = Object.fromEntries(
    normalizedHeader.map((name, index) => [name, index])
  );
  const required = ["home_team", "away_team", "starts_at"];

  for (const column of required) {
    if (indexes[column] === undefined) {
      throw new Error(`Coluna obrigatoria ausente: ${column}`);
    }
  }

  const matches = records.map((record, recordIndex) => {
    const lineNumber = recordIndex + 2;
    const homeTeam = record[indexes.home_team]?.trim();
    const awayTeam = record[indexes.away_team]?.trim();
    const startsAtValue = record[indexes.starts_at]?.trim();

    if (!homeTeam || !awayTeam || !startsAtValue) {
      throw new Error(`Linha ${lineNumber}: preencha home_team, away_team e starts_at.`);
    }

    if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
      throw new Error(`Linha ${lineNumber}: time da casa e visitante nao podem ser iguais.`);
    }

    const startsAt = new Date(startsAtValue);

    if (Number.isNaN(startsAt.getTime())) {
      throw new Error(`Linha ${lineNumber}: data invalida (${startsAtValue}).`);
    }

    return {
      home_team: homeTeam,
      away_team: awayTeam,
      starts_at: startsAt.toISOString(),
      is_premium: ["true", "1", "sim", "yes"].includes(
        (record[indexes.is_premium] || "false").toLowerCase()
      )
    };
  });

  const { error } = await supabase.from("matches").insert(matches);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

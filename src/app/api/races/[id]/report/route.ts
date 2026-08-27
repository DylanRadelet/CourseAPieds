import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { computeLevelIndex } from "@/lib/level";
import { generateRaceReport } from "@/lib/ai/raceReport";
import type { Profile, Race } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();

  const [
    { data: race, error: raceError },
    { data: allRaces, error: allRacesError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase.from("CAP_races").select("*").eq("id", id).single(),
    supabase.from("CAP_races").select("*"),
    supabase.from("CAP_profile").select("*").eq("id", PROFILE_ID).maybeSingle(),
  ]);

  if (raceError || !race) {
    return NextResponse.json({ error: "Course introuvable." }, { status: 404 });
  }
  const typedRace = race as Race;
  if (!typedRace.result_time) {
    return NextResponse.json(
      { error: "Enregistre un temps de course avant de générer un rapport." },
      { status: 400 }
    );
  }
  if (allRacesError || profileError) {
    return NextResponse.json(
      { error: allRacesError?.message || profileError?.message },
      { status: 500 }
    );
  }

  const otherRaces = ((allRaces as Race[]) ?? []).filter((r) => r.id !== typedRace.id);
  const previousBest = computeLevelIndex(otherRaces, [], []).race;

  try {
    const { report } = await generateRaceReport({
      race: typedRace,
      profile: (profile as Profile) ?? null,
      previousBest,
    });

    const { data: updated, error: updateError } = await supabase
      .from("CAP_races")
      .update({ ai_report: report, ai_report_generated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ race: updated, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur IA inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

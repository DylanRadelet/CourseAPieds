import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";

const createRaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  race_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  distance_label: z.string().trim().max(100).optional().nullable(),
  elevation_gain_m: z.number().int().nonnegative().max(20000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("CAP_races")
    .select("*")
    .order("race_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ races: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createRaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("CAP_races")
    .insert({
      name: parsed.data.name,
      race_date: parsed.data.race_date,
      distance_label: parsed.data.distance_label || null,
      elevation_gain_m: parsed.data.elevation_gain_m ?? null,
      notes: parsed.data.notes || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ race: data }, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";

type Context = { params: Promise<{ id: string }> };

// Every field is optional — PATCH only touches the keys actually present in
// the request body, so the race-edit form and the results form (two
// different partial updates on the same resource) don't clobber each other.
const editSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  race_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  distance_label: z.string().trim().max(100).nullable().optional(),
  elevation_gain_m: z.number().int().nonnegative().max(20000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  result_time: z.string().trim().max(50).nullable().optional(),
  result_rank: z.string().trim().max(100).nullable().optional(),
  result_feeling: z.number().int().min(1).max(5).nullable().optional(),
  result_notes: z.string().trim().max(2000).nullable().optional(),
});

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();

  const [{ data: race, error: raceError }, { data: workouts, error: workoutsError }] =
    await Promise.all([
      supabase.from("CAP_races").select("*").eq("id", id).single(),
      supabase
        .from("CAP_workouts")
        .select("*")
        .eq("race_id", id)
        .order("workout_date", { ascending: true }),
    ]);

  if (raceError) {
    return NextResponse.json({ error: raceError.message }, { status: 404 });
  }
  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  return NextResponse.json({ race, workouts });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Only forward keys the client actually sent — a key absent from the
  // request must leave the stored value untouched.
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    update[key] = value === "" ? null : value;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("CAP_races")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ race: data });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("CAP_races").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

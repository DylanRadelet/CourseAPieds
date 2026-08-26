import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";

const upsertSchema = z.object({
  race_id: z.string().uuid(),
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  distance_km: z.number().nonnegative().max(1000).optional().nullable(),
  duration_min: z.number().int().nonnegative().max(1440).optional().nullable(),
  done: z.boolean().optional(),
  actual_distance_km: z.number().nonnegative().max(1000).optional().nullable(),
  actual_duration_min: z.number().nonnegative().max(1440).optional().nullable(),
  actual_avg_heart_rate: z.number().int().positive().max(300).optional().nullable(),
  actual_elevation_gain_m: z.number().int().nonnegative().max(20000).optional().nullable(),
  actual_notes: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    race_id,
    workout_date,
    title,
    notes,
    distance_km,
    duration_min,
    done,
    actual_distance_km,
    actual_duration_min,
    actual_avg_heart_rate,
    actual_elevation_gain_m,
    actual_notes,
  } = parsed.data;

  const supabase = getSupabaseServerClient();

  // An empty cell (nothing filled in, planned or actual) is deleted instead
  // of stored.
  const isEmpty =
    !title &&
    !notes &&
    !distance_km &&
    !duration_min &&
    !done &&
    !actual_distance_km &&
    !actual_duration_min &&
    !actual_avg_heart_rate &&
    !actual_elevation_gain_m &&
    !actual_notes;

  if (isEmpty) {
    const { error } = await supabase
      .from("CAP_workouts")
      .delete()
      .eq("race_id", race_id)
      .eq("workout_date", workout_date);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ workout: null });
  }

  const { data, error } = await supabase
    .from("CAP_workouts")
    .upsert(
      {
        race_id,
        workout_date,
        title: title || null,
        notes: notes || null,
        distance_km: distance_km ?? null,
        duration_min: duration_min ?? null,
        done: done ?? false,
        actual_distance_km: actual_distance_km ?? null,
        actual_duration_min: actual_duration_min ?? null,
        actual_avg_heart_rate: actual_avg_heart_rate ?? null,
        actual_elevation_gain_m: actual_elevation_gain_m ?? null,
        actual_notes: actual_notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "race_id,workout_date" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ workout: data });
}

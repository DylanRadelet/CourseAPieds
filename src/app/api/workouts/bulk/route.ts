import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";

const bulkSchema = z.object({
  race_id: z.string().uuid(),
  sessions: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        title: z.string().trim().max(200).optional().nullable(),
        distance_km: z.number().nonnegative().max(1000).optional().nullable(),
        duration_min: z.number().int().nonnegative().max(1440).optional().nullable(),
        notes: z.string().trim().max(2000).optional().nullable(),
      })
    )
    .min(1)
    .max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const rows = parsed.data.sessions.map((session) => ({
    race_id: parsed.data.race_id,
    workout_date: session.date,
    title: session.title || null,
    notes: session.notes || null,
    distance_km: session.distance_km ?? null,
    duration_min: session.duration_min ?? null,
    done: false,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("CAP_workouts")
    .upsert(rows, { onConflict: "race_id,workout_date" })
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ workouts: data });
}

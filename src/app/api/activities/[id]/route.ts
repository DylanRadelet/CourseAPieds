import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";

type Context = { params: Promise<{ id: string }> };

const activitySchema = z.object({
  activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().max(200).optional().nullable(),
  distance_km: z.number().nonnegative().max(1000).optional().nullable(),
  duration_min: z.number().nonnegative().max(1440).optional().nullable(),
  avg_heart_rate: z.number().int().positive().max(300).optional().nullable(),
  elevation_gain_m: z.number().int().nonnegative().max(20000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("CAP_activities")
    .update({
      activity_date: parsed.data.activity_date,
      title: parsed.data.title || null,
      distance_km: parsed.data.distance_km ?? null,
      duration_min: parsed.data.duration_min ?? null,
      avg_heart_rate: parsed.data.avg_heart_rate ?? null,
      elevation_gain_m: parsed.data.elevation_gain_m ?? null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ activity: data });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("CAP_activities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

const profileSchema = z.object({
  full_name: z.string().trim().max(200).optional().nullable(),
  photo_data_url: z
    .string()
    .max(2_000_000, "Photo trop lourde.")
    .optional()
    .nullable(),
  level: z.string().trim().max(50).optional().nullable(),
  terrain_access: z.array(z.string().max(50)).max(20).optional(),
  objective: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  weight_kg: z.number().positive().max(400).optional().nullable(),
  height_cm: z.number().positive().max(300).optional().nullable(),
  strength_access: z.array(z.string().max(50)).max(20).optional(),
  secondary_objective: z.string().trim().max(1000).optional().nullable(),
  secondary_objective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("CAP_profile")
    .select("*")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("CAP_profile")
    .upsert(
      {
        id: PROFILE_ID,
        full_name: parsed.data.full_name || null,
        photo_data_url: parsed.data.photo_data_url || null,
        level: parsed.data.level || null,
        terrain_access: parsed.data.terrain_access ?? [],
        objective: parsed.data.objective || null,
        notes: parsed.data.notes || null,
        bio: parsed.data.bio || null,
        weight_kg: parsed.data.weight_kg ?? null,
        height_cm: parsed.data.height_cm ?? null,
        strength_access: parsed.data.strength_access ?? [],
        secondary_objective: parsed.data.secondary_objective || null,
        secondary_objective_date: parsed.data.secondary_objective_date || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("CAP_activities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

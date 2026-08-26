import { Sidebar } from "@/components/Sidebar";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityList } from "@/components/ActivityList";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { Activity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const supabase = getSupabaseServerClient();
  const { data: activities } = await supabase
    .from("CAP_activities")
    .select("*")
    .order("activity_date", { ascending: false });

  return (
    <>
      <Sidebar />
      <main className="flex-1 px-4 pt-6 pb-28 sm:pl-28 sm:pr-8 sm:pt-8 sm:pb-8 max-w-5xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-cap-black mb-1">
            Historique
          </h1>
          <p className="text-sm text-cap-muted">
            Tes courses passées (ex: importées de Garmin) — utilisées par l&apos;IA
            comme preuve de ton niveau actuel.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[320px_1fr] items-start">
          <ActivityForm />
          <ActivityList activities={(activities as Activity[]) ?? []} />
        </div>
      </main>
    </>
  );
}

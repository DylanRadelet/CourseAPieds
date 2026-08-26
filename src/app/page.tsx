import { CalendarRange, Plus } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { RaceForm } from "@/components/RaceForm";
import { RaceList } from "@/components/RaceList";
import { ThisWeekWidget } from "@/components/ThisWeekWidget";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { Race } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = getSupabaseServerClient();
  const { data: races } = await supabase
    .from("CAP_races")
    .select("*")
    .order("race_date", { ascending: true });

  return (
    <>
      <Sidebar />
      <main className="flex-1 px-4 pt-6 pb-28 sm:pl-28 sm:pr-8 sm:pt-8 sm:pb-8 max-w-5xl w-full mx-auto space-y-6">
        <AccordionSection
          title="Cette semaine"
          icon={<CalendarRange size={15} strokeWidth={2.25} className="text-cap-violet" />}
          mobileOnly
        >
          <ThisWeekWidget />
        </AccordionSection>

        <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
          <AccordionSection
            title="Nouvelle course"
            icon={<Plus size={15} strokeWidth={2.25} className="text-cap-violet" />}
            mobileOnly
          >
            <RaceForm />
          </AccordionSection>
          <RaceList races={(races as Race[]) ?? []} />
        </div>
      </main>
    </>
  );
}

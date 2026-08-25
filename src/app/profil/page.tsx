import { Sidebar } from "@/components/Sidebar";
import { ProfileForm } from "@/components/ProfileForm";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

export default async function ProfilePage() {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("CAP_profile")
    .select("*")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  return (
    <>
      <Sidebar />
      <main className="flex-1 px-4 pt-6 pb-28 sm:pl-28 sm:pr-8 sm:pt-8 sm:pb-8 max-w-2xl w-full mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight text-cap-black mb-1">
          Profil coureur
        </h1>
        <p className="text-sm text-cap-muted mb-6">
          Ces infos sont utilisées par l&apos;IA pour proposer des plans
          d&apos;entraînement adaptés.
        </p>
        <ProfileForm initialProfile={(profile as Profile) ?? null} />
      </main>
    </>
  );
}

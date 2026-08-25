import Link from "next/link";
import { BarChart3, Footprints, Home, User } from "lucide-react";
import { NavIconButton } from "./NavIconButton";
import { SidebarLogoutButton } from "./SidebarLogoutButton";
import { getSupabaseServerClient } from "@/lib/supabase";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

function ProfileAvatarLink({
  photoDataUrl,
  className,
}: {
  photoDataUrl: string | null | undefined;
  className: string;
}) {
  return (
    <Link
      href="/profil"
      title="Profil"
      className={`rounded-full bg-cap-black text-cap-white flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      {photoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoDataUrl} alt="Profil" className="w-full h-full object-cover" />
      ) : (
        <User size={16} strokeWidth={2.25} />
      )}
    </Link>
  );
}

export async function Sidebar() {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("CAP_profile")
    .select("photo_data_url")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  return (
    <>
      {/* Desktop: floating vertical pill on the left */}
      <nav
        className="hidden sm:flex fixed left-4 top-4 bottom-4 z-40 w-16 neo flex-col items-center py-6 gap-5"
        aria-label="Navigation"
      >
        <div
          className="neo-sm w-10 h-10 flex items-center justify-center text-cap-violet shrink-0"
          title="CAP"
        >
          <Footprints size={18} strokeWidth={2.25} />
        </div>

        <NavIconButton
          href="/"
          icon={<Home size={16} strokeWidth={2.25} />}
          label="Accueil"
        />
        <NavIconButton
          href="/stats"
          icon={<BarChart3 size={16} strokeWidth={2.25} />}
          label="Statistiques"
        />

        <div className="flex-1" />

        <ProfileAvatarLink photoDataUrl={profile?.photo_data_url} className="w-10 h-10" />

        <SidebarLogoutButton />
      </nav>

      {/* Mobile: floating horizontal bar pinned to the bottom */}
      <nav
        className="flex sm:hidden fixed left-2 right-2 bottom-2 z-40 neo items-center justify-around py-2.5 px-3"
        aria-label="Navigation"
      >
        <NavIconButton
          href="/"
          icon={<Home size={16} strokeWidth={2.25} />}
          label="Accueil"
        />
        <NavIconButton
          href="/stats"
          icon={<BarChart3 size={16} strokeWidth={2.25} />}
          label="Statistiques"
        />
        <ProfileAvatarLink photoDataUrl={profile?.photo_data_url} className="w-9 h-9" />
        <SidebarLogoutButton />
      </nav>
    </>
  );
}

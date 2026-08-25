"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SidebarLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="neo-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-cap-muted hover:text-red-600 shrink-0"
      title="Se déconnecter"
      aria-label="Se déconnecter"
    >
      <LogOut size={16} strokeWidth={2.25} />
    </button>
  );
}

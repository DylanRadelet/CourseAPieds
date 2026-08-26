"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Heart, Mountain, Timer, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { computePace, formatMinutesToDuration } from "@/lib/pace";
import type { Activity } from "@/lib/types";

function ActivityCard({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const pace = computePace(activity.distance_km, activity.duration_min);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="neo p-5 relative flex flex-col gap-2">
      <button
        onClick={() => setConfirming(true)}
        className="neo-btn absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-cap-muted hover:text-red-600"
        title="Supprimer"
        aria-label="Supprimer cette course"
      >
        <Trash2 size={14} strokeWidth={2.25} />
      </button>

      <div className="pr-10">
        <p className="text-base font-bold text-cap-black">
          {activity.title || "Course"}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-cap-muted mt-0.5">
          <CalendarDays size={12} strokeWidth={2.25} />
          {format(new Date(`${activity.activity_date}T00:00:00`), "EEEE d MMMM yyyy", {
            locale: fr,
          })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cap-black mt-1">
        {activity.distance_km ? <span className="font-semibold">{activity.distance_km} km</span> : null}
        {activity.duration_min ? <span>{formatMinutesToDuration(activity.duration_min)}</span> : null}
        {pace ? (
          <span className="flex items-center gap-1 text-cap-violet font-semibold">
            <Timer size={12} strokeWidth={2.5} />
            {pace}
          </span>
        ) : null}
        {activity.avg_heart_rate ? (
          <span className="flex items-center gap-1 text-cap-muted">
            <Heart size={12} strokeWidth={2.25} />
            {activity.avg_heart_rate} bpm
          </span>
        ) : null}
        {activity.elevation_gain_m ? (
          <span className="flex items-center gap-1 text-cap-muted">
            <Mountain size={12} strokeWidth={2.25} />
            D+ {activity.elevation_gain_m} m
          </span>
        ) : null}
      </div>

      {activity.notes ? (
        <p className="text-xs text-cap-muted whitespace-pre-wrap mt-1">{activity.notes}</p>
      ) : null}

      {confirming ? (
        <ConfirmDialog
          title="Supprimer cette course"
          description="Cette entrée d'historique sera définitivement supprimée."
          confirmLabel="Supprimer"
          danger
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </div>
  );
}

export function ActivityList({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="neo p-8 text-center text-cap-muted text-sm">
        Aucune course dans l&apos;historique pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

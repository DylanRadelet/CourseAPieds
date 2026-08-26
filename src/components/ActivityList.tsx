"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Heart, Mountain, Pencil, Timer } from "lucide-react";
import { RecordCard } from "@/components/ui/RecordCard";
import { DeleteIconButton } from "@/components/ui/DeleteIconButton";
import { NotesIndicator } from "@/components/ui/NotesIndicator";
import { EditActivityModal } from "@/components/EditActivityModal";
import { computePace, formatMinutesToDuration } from "@/lib/pace";
import { formatDistance } from "@/lib/format";
import type { Activity } from "@/lib/types";

function ActivityCard({ activity: initial }: { activity: Activity }) {
  const router = useRouter();
  const [activity, setActivity] = useState(initial);
  const [editing, setEditing] = useState(false);

  const pace = computePace(activity.distance_km, activity.duration_min);
  const activityDate = new Date(`${activity.activity_date}T00:00:00`);

  return (
    <RecordCard
      header={
        <>
          <p className="text-base font-bold text-cap-black">{activity.title || "Course"}</p>
          <span className="flex items-center gap-1.5 text-xs text-cap-muted mt-0.5">
            <CalendarDays size={12} strokeWidth={2.25} />
            {format(activityDate, "EEEE d MMMM yyyy", { locale: fr })}
          </span>
        </>
      }
      actions={
        <>
          <button
            onClick={() => setEditing(true)}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted hover:text-cap-violet"
            title="Modifier"
            aria-label="Modifier cette course"
          >
            <Pencil size={14} strokeWidth={2.25} />
          </button>
          <DeleteIconButton
            confirmTitle="Supprimer cette course"
            confirmDescription="Cette entrée d'historique sera définitivement supprimée."
            onConfirm={async () => {
              await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
              router.refresh();
            }}
          />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cap-black mt-1">
        {activity.distance_km ? (
          <span className="font-semibold">{formatDistance(activity.distance_km)}</span>
        ) : null}
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
        <NotesIndicator date={activityDate} title={activity.title} notes={activity.notes} />
      </div>

      {editing ? (
        <EditActivityModal
          activity={activity}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setActivity(updated);
            setEditing(false);
          }}
        />
      ) : null}
    </RecordCard>
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

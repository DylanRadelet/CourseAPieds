"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Dumbbell, Footprints, Save, Target, User } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import { AccordionSection } from "@/components/ui/AccordionSection";
import {
  LEVEL_OPTIONS,
  STRENGTH_OPTIONS,
  TERRAIN_OPTIONS,
  type Profile,
} from "@/lib/types";

const MAX_PHOTO_DIMENSION = 480;

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide."));
      img.onload = () => {
        const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de traiter l'image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ChipGroup({
  options,
  selected,
  onToggle,
  activeClassName,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
  activeClassName: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              active ? activeClassName : "neo-inset text-cap-muted"
            }`}
          >
            {active ? <Check size={12} strokeWidth={3} /> : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileForm({ initialProfile }: { initialProfile: Profile | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState(initialProfile?.photo_data_url ?? "");
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");

  const [level, setLevel] = useState(initialProfile?.level ?? "");
  const [terrain, setTerrain] = useState<string[]>(initialProfile?.terrain_access ?? []);
  const [notes, setNotes] = useState(initialProfile?.notes ?? "");

  const [strengthAccess, setStrengthAccess] = useState<string[]>(
    initialProfile?.strength_access ?? []
  );

  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [weightKg, setWeightKg] = useState(
    initialProfile?.weight_kg != null ? String(initialProfile.weight_kg) : ""
  );
  const [heightCm, setHeightCm] = useState(
    initialProfile?.height_cm != null ? String(initialProfile.height_cm) : ""
  );

  const [objective, setObjective] = useState(initialProfile?.objective ?? "");
  const [secondaryObjective, setSecondaryObjective] = useState(
    initialProfile?.secondary_objective ?? ""
  );
  const [secondaryObjectiveDate, setSecondaryObjectiveDate] = useState(
    initialProfile?.secondary_objective_date ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizePhoto(file);
      setPhoto(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo invalide.");
    }
  }

  function toggleFrom(list: string[], setList: (v: string[]) => void, option: string) {
    setList(list.includes(option) ? list.filter((t) => t !== option) : [...list, option]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName || undefined,
        photo_data_url: photo || undefined,
        level: level || undefined,
        terrain_access: terrain,
        notes: notes || undefined,
        strength_access: strengthAccess,
        bio: bio || undefined,
        weight_kg: weightKg ? Number(weightKg) : undefined,
        height_cm: heightCm ? Number(heightCm) : undefined,
        objective: objective || undefined,
        secondary_objective: secondaryObjective || undefined,
        secondary_objective_date: secondaryObjectiveDate || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer le profil.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="neo p-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full bg-cap-black text-cap-white flex items-center justify-center overflow-hidden shrink-0 group"
          title="Changer la photo"
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Photo de profil" className="w-full h-full object-cover" />
          ) : (
            <User size={28} strokeWidth={2} />
          )}
          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={18} strokeWidth={2.25} className="text-white" />
          </span>
        </button>
        <div className="flex-1 min-w-0 space-y-3">
          <NeoInput
            placeholder="Ton nom"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div>
            <NeoButton type="button" onClick={() => fileInputRef.current?.click()}>
              <Camera size={15} strokeWidth={2.25} />
              {photo ? "Changer la photo" : "Ajouter une photo"}
            </NeoButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <AccordionSection
        title="Course à pied"
        icon={<Footprints size={15} strokeWidth={2.25} className="text-cap-violet" />}
        defaultOpen
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Niveau</label>
          <div className="flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLevel(level === option ? "" : option)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  level === option
                    ? "bg-cap-violet text-cap-white"
                    : "neo-inset text-cap-muted"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            Terrains à disposition
          </label>
          <ChipGroup
            options={TERRAIN_OPTIONS}
            selected={terrain}
            onToggle={(o) => toggleFrom(terrain, setTerrain, o)}
            activeClassName="bg-cap-lime text-cap-black"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            Infos complémentaires
          </label>
          <NeoTextarea
            rows={3}
            placeholder="Disponibilités, blessures, contraintes, matériel..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </AccordionSection>

      <AccordionSection
        title="Musculation"
        icon={<Dumbbell size={15} strokeWidth={2.25} className="text-cap-violet" />}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            Accès musculation (laisse vide si tu ne fais que de la course)
          </label>
          <ChipGroup
            options={STRENGTH_OPTIONS}
            selected={strengthAccess}
            onToggle={(o) => toggleFrom(strengthAccess, setStrengthAccess, o)}
            activeClassName="bg-cap-violet text-cap-white"
          />
        </div>
      </AccordionSection>

      <AccordionSection
        title="Le coureur"
        icon={<User size={15} strokeWidth={2.25} className="text-cap-violet" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">Poids (kg)</label>
            <NeoInput
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="70"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">Taille (cm)</label>
            <NeoInput
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="175"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Bio</label>
          <NeoTextarea
            rows={3}
            placeholder="Ton parcours, ton expérience, ce qui te motive..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </AccordionSection>

      <AccordionSection
        title="Objectifs"
        icon={<Target size={15} strokeWidth={2.25} className="text-cap-violet" />}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Objectif principal</label>
          <NeoTextarea
            rows={2}
            placeholder="Ex: passer sous les 45 minutes sur 10km, terminer mon premier trail..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            Objectif secondaire
          </label>
          <NeoTextarea
            rows={2}
            placeholder="Ex: perdre 3kg, réussir une sortie de 20km sans marcher..."
            value={secondaryObjective}
            onChange={(e) => setSecondaryObjective(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            Date cible de l&apos;objectif secondaire
          </label>
          <NeoInput
            type="date"
            value={secondaryObjectiveDate}
            onChange={(e) => setSecondaryObjectiveDate(e.target.value)}
          />
        </div>
      </AccordionSection>

      {error ? <p className="text-sm text-red-600 px-1">{error}</p> : null}

      <div className="flex items-center gap-3 px-1">
        <NeoButton type="submit" variant="violet" disabled={loading}>
          <Save size={15} strokeWidth={2.25} />
          {loading ? "Enregistrement..." : "Enregistrer"}
        </NeoButton>
        {saved ? <span className="text-xs text-cap-muted">Profil enregistré.</span> : null}
      </div>
    </form>
  );
}

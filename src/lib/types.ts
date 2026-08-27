export type Race = {
  id: string;
  name: string;
  race_date: string; // YYYY-MM-DD
  distance_label: string | null;
  elevation_gain_m: number | null;
  notes: string | null;
  result_time: string | null;
  result_rank: string | null;
  result_feeling: number | null; // 1-5
  result_notes: string | null;
  ai_report: string | null;
  ai_report_generated_at: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  race_id: string;
  workout_date: string; // YYYY-MM-DD
  title: string | null;
  notes: string | null;
  distance_km: number | null;
  duration_min: number | null;
  done: boolean;
  actual_distance_km: number | null;
  actual_duration_min: number | null;
  actual_avg_heart_rate: number | null;
  actual_elevation_gain_m: number | null;
  actual_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  activity_date: string; // YYYY-MM-DD
  title: string | null;
  distance_km: number | null;
  duration_min: number | null;
  avg_heart_rate: number | null;
  elevation_gain_m: number | null;
  notes: string | null;
  created_at: string;
};

export const TERRAIN_OPTIONS = [
  "Route",
  "Sentier / Trail",
  "Forêt",
  "Piste",
  "Montagne",
  "Tapis de course",
] as const;

export type TerrainOption = (typeof TERRAIN_OPTIONS)[number];

export const LEVEL_OPTIONS = ["Débutant", "Intermédiaire", "Confirmé"] as const;
export type LevelOption = (typeof LEVEL_OPTIONS)[number];

export const STRENGTH_OPTIONS = [
  "Salle de sport",
  "Poids du corps",
  "Haltères / élastiques à la maison",
] as const;

export type StrengthOption = (typeof STRENGTH_OPTIONS)[number];

export type Profile = {
  id: string;
  full_name: string | null;
  photo_data_url: string | null;
  level: string | null;
  terrain_access: string[];
  objective: string | null;
  notes: string | null;
  bio: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  strength_access: string[];
  secondary_objective: string | null;
  secondary_objective_date: string | null; // YYYY-MM-DD
  updated_at: string;
};

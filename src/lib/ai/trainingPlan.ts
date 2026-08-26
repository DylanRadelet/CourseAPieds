import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { computePace, formatMinutesToDuration } from "@/lib/pace";
import type { Activity, Profile, Race, Workout } from "@/lib/types";

export type CompletedWorkout = Workout & { raceName: string };

const ProposedSessionSchema = z.object({
  date: z.string().describe("Date de la séance au format YYYY-MM-DD"),
  title: z
    .string()
    .describe("Titre court, ex: 'Footing facile', 'Fractionné 8x400m', 'Repos'"),
  distance_km: z.number().nullable().describe("Distance en km, null si non applicable"),
  duration_min: z.number().int().nullable().describe("Durée en minutes, null si non applicable"),
  notes: z
    .string()
    .nullable()
    .describe("Détails utiles: allure, terrain conseillé, conseils"),
});

const TrainingPlanSchema = z.object({
  summary: z
    .string()
    .describe("Résumé en 2-3 phrases de la logique du plan, en français, pour le coureur"),
  sessions: z.array(ProposedSessionSchema),
});

export type ProposedSession = z.infer<typeof ProposedSessionSchema>;
export type GeneratedTrainingPlan = z.infer<typeof TrainingPlanSchema>;

function formatRaceHistoryLine(race: Race): string {
  const parts = [`- ${race.name} (${race.race_date})`];
  if (race.distance_label) parts.push(race.distance_label);
  if (race.elevation_gain_m) parts.push(`D+ ${race.elevation_gain_m}m`);
  if (race.result_time) parts.push(`résultat: ${race.result_time}`);
  if (race.result_rank) parts.push(`classement: ${race.result_rank}`);
  if (race.result_feeling) parts.push(`ressenti: ${race.result_feeling}/5`);
  if (race.result_notes) parts.push(`notes: ${race.result_notes}`);
  return parts.join(" — ");
}

function formatActivityLine(activity: Activity): string {
  const parts = [`- ${activity.activity_date}`];
  if (activity.title) parts.push(activity.title);
  if (activity.distance_km) parts.push(`${activity.distance_km} km`);
  if (activity.duration_min) parts.push(formatMinutesToDuration(activity.duration_min));
  const pace = computePace(activity.distance_km, activity.duration_min);
  if (pace) parts.push(`allure ${pace}`);
  if (activity.avg_heart_rate) parts.push(`FC moy ${activity.avg_heart_rate} bpm`);
  if (activity.elevation_gain_m) parts.push(`D+ ${activity.elevation_gain_m}m`);
  if (activity.notes) parts.push(`notes: ${activity.notes}`);
  return parts.join(" — ");
}

function formatCompletedWorkoutLine(workout: CompletedWorkout): string {
  const planned = [workout.title, workout.distance_km ? `${workout.distance_km} km` : null]
    .filter(Boolean)
    .join(", ");

  const actualParts: string[] = [];
  if (workout.actual_distance_km) actualParts.push(`${workout.actual_distance_km} km`);
  if (workout.actual_duration_min) {
    actualParts.push(formatMinutesToDuration(workout.actual_duration_min));
  }
  const pace = computePace(workout.actual_distance_km, workout.actual_duration_min);
  if (pace) actualParts.push(`allure ${pace}`);
  if (workout.actual_avg_heart_rate) actualParts.push(`FC moy ${workout.actual_avg_heart_rate} bpm`);
  if (workout.actual_elevation_gain_m) actualParts.push(`D+ ${workout.actual_elevation_gain_m}m`);
  if (workout.actual_notes) actualParts.push(`notes: ${workout.actual_notes}`);

  const actual = actualParts.length ? actualParts.join(", ") : "réalisé sans détails";

  return `- ${workout.workout_date} (${workout.raceName}) — prévu: ${planned || "séance"} — réalisé: ${actual}`;
}

function buildUserPrompt(input: {
  profile: Profile | null;
  race: Race;
  previousRace: Pick<Race, "name" | "race_date"> | null;
  pastRaces: Race[];
  activities: Activity[];
  completedWorkouts: CompletedWorkout[];
  emptyDates: string[];
}): string {
  const { profile, race, previousRace, pastRaces, activities, completedWorkouts, emptyDates } =
    input;

  const lines: string[] = [];

  lines.push("## Profil du coureur");
  if (profile) {
    if (profile.full_name) lines.push(`Nom: ${profile.full_name}`);
    if (profile.weight_kg) lines.push(`Poids: ${profile.weight_kg} kg`);
    if (profile.height_cm) lines.push(`Taille: ${profile.height_cm} cm`);
    if (profile.bio) lines.push(`Bio / parcours: ${profile.bio}`);
    if (profile.level) lines.push(`Niveau: ${profile.level}`);
    if (profile.terrain_access.length) {
      lines.push(`Terrains disponibles: ${profile.terrain_access.join(", ")}`);
    }
    if (profile.strength_access.length) {
      lines.push(
        `Fait aussi de la musculation — accès: ${profile.strength_access.join(", ")}. Tiens-en compte dans la charge globale et propose éventuellement des séances de renforcement complémentaires si pertinent.`
      );
    }
    if (profile.objective) lines.push(`Objectif général: ${profile.objective}`);
    if (profile.secondary_objective) {
      const datePart = profile.secondary_objective_date
        ? ` (date cible: ${profile.secondary_objective_date})`
        : "";
      lines.push(`Objectif secondaire: ${profile.secondary_objective}${datePart}`);
    }
    if (profile.notes) lines.push(`Infos complémentaires: ${profile.notes}`);
  } else {
    lines.push("Aucun profil renseigné — reste générique et prudent.");
  }

  lines.push("");
  lines.push("## Course visée");
  lines.push(`${race.name} — ${race.race_date}`);
  if (race.distance_label) lines.push(`Distance: ${race.distance_label}`);
  if (race.elevation_gain_m) lines.push(`D+: ${race.elevation_gain_m} m`);
  if (race.notes) {
    lines.push(
      `Objectif(s) spécifiques à CETTE course (fixés par le coureur, peuvent inclure plusieurs sous-objectifs): ${race.notes}`
    );
  }

  if (previousRace) {
    lines.push("");
    lines.push(
      `## Bloc d'entraînement\nCe plan couvre uniquement la période entre "${previousRace.name}" (${previousRace.race_date}) et cette course — ne propose rien avant.`
    );
  }

  if (pastRaces.length) {
    lines.push("");
    lines.push("## Historique de courses (plus récentes en premier)");
    for (const r of pastRaces) lines.push(formatRaceHistoryLine(r));
  }

  if (activities.length) {
    lines.push("");
    lines.push(
      "## Historique manuel (saisi par le coureur, ex: Garmin — preuve fiable de son niveau actuel, plus récent en premier)"
    );
    for (const a of activities) lines.push(formatActivityLine(a));
  }

  if (completedWorkouts.length) {
    lines.push("");
    lines.push(
      "## Séances déjà réalisées dans l'app, toutes courses confondues (prévu vs réalisé, plus récent en premier)"
    );
    for (const w of completedWorkouts) lines.push(formatCompletedWorkoutLine(w));
  }

  if (!activities.length && !completedWorkouts.length && !pastRaces.length) {
    lines.push("");
    lines.push(
      "## Historique\nAucun historique disponible (ni course terminée, ni séance réalisée, ni entrée manuelle) — reste prudent, n'invente aucune performance passée."
    );
  }

  lines.push("");
  lines.push("## Dates à couvrir");
  lines.push(
  `Les dates suivantes représentent les cases disponibles du calendrier.

Tu dois retourner exactement une entrée par date et n'inventer aucune autre date.

IMPORTANT :
Une date disponible ne signifie pas qu'une séance de course doit obligatoirement être programmée.
Choisis librement entre entraînement et repos selon la récupération, le niveau et la progression optimale du coureur.

Ne cherche jamais à maximiser le nombre de séances.

Pour un jour sans entraînement :
- title = "Repos"
- distance_km = null
- duration_min = null`
);
  lines.push(emptyDates.join(", "));

  return lines.join("\n");
}

const SYSTEM_PROMPT = `
Tu es un coach expert en course à pied, entraînement d'endurance et préparation de compétitions.

Tu accompagnes tous les profils :
- débutant complet ;
- reprise après une longue interruption ;
- coureur loisir ;
- coureur intermédiaire ;
- coureur confirmé ;
- coureur compétitif ;
- route ;
- trail ;
- courses avec fort dénivelé.

Ton objectif n'est PAS de produire le plan le plus difficile possible.
Ton objectif est de produire le plan le plus pertinent, progressif, réaliste et durable pour CE coureur.

# 1. PRINCIPES GÉNÉRAUX

Analyse toujours avant de construire le plan :
1. le niveau réel du coureur ;
2. son historique récent ;
3. son expérience ;
4. son objectif général ;
5. l'objectif spécifique de la prochaine course ;
6. la distance de la course ;
7. son dénivelé ;
8. le temps disponible avant la course ;
9. les terrains disponibles ;
10. les courses récemment effectuées ;
11. la proximité éventuelle entre plusieurs compétitions ;
12. les informations complémentaires données par le coureur.

Ne base jamais le plan uniquement sur le niveau déclaré.
Si l'historique indique un niveau différent, privilégie les données objectives disponibles.

Ne suppose jamais qu'un coureur peut supporter une charge importante simplement parce qu'il vise un objectif ambitieux.

# 2. ADAPTATION AU NIVEAU

## Débutant / reprise

Priorités :
- créer de la régularité ;
- développer progressivement l'endurance ;
- limiter les blessures ;
- apprendre à courir facilement ;
- pouvoir utiliser course/marche si nécessaire.

Les premières semaines peuvent contenir principalement :
- footing très facile ;
- alternance course/marche ;
- petites accélérations contrôlées ;
- repos.

Évite les séances complexes ou très intenses si elles ne sont pas nécessaires.

## Intermédiaire

Utilise progressivement :
- endurance fondamentale ;
- footing facile ;
- tempo ;
- seuil ;
- fractionné ;
- côtes ;
- sortie longue ;
- récupération.

## Confirmé / compétitif

Tu peux utiliser :
- séances spécifiques à l'allure cible ;
- seuil ;
- VO2max ;
- répétitions courtes ;
- répétitions longues ;
- côtes ;
- blocs spécifiques ;
- sorties longues structurées ;
- séances spécifiques au profil de course.

Mais chaque séance doit avoir une raison précise.

# 3. GESTION DE LA CHARGE

La progression doit être graduelle.

Ne crée jamais une augmentation brutale du volume ou de l'intensité.

Privilégie la continuité plutôt qu'une règle mathématique rigide.

Après :
- une compétition ;
- une séance particulièrement difficile ;
- une sortie longue importante ;

prévois suffisamment de récupération.

Ne programme jamais deux séances difficiles consécutives.

Une séance difficile peut être :
- fractionné ;
- seuil ;
- tempo soutenu ;
- côtes intensives ;
- sortie longue exigeante ;
- simulation de course ;
- compétition.

Après une course importante, considère que la course elle-même constitue une séance très exigeante.

Plus le coureur est débutant, plus la proportion de travail facile doit être importante.

La majorité de l'entraînement doit rester confortable.

# 4. INTENSITÉ

Ne donne pas une allure précise arbitraire si les données disponibles ne permettent pas de la déterminer correctement.

Quand une allure précise n'est pas suffisamment fiable, utilise le ressenti d'effort (RPE) :

RPE 1-2 :
récupération extrêmement facile.

RPE 2-3 :
footing facile, conversation complète possible.

RPE 4-5 :
endurance soutenue mais confortable.

RPE 6 :
tempo contrôlé.

RPE 7 :
seuil, effort difficile mais maîtrisé.

RPE 8-9 :
fractionné intense.

RPE 10 :
effort maximal, rarement nécessaire à l'entraînement.

Pour un footing facile, rappelle si nécessaire que le coureur doit pouvoir tenir une conversation.

# 5. SPÉCIFICITÉ DE LA COURSE

Plus la course approche, plus certaines séances peuvent ressembler aux contraintes de la compétition.

Adapte le plan en fonction :
- de la distance ;
- du dénivelé ;
- du terrain ;
- du profil de course ;
- de l'objectif chronométrique éventuel ;
- des objectifs techniques donnés par le coureur.

Exemples :

5 km :
- économie de course ;
- vitesse ;
- VO2max ;
- allure spécifique ;
- seuil.

10 km :
- endurance ;
- seuil ;
- allure spécifique 10 km ;
- VO2max.

Semi-marathon :
- endurance ;
- seuil ;
- allure semi ;
- sorties longues progressives.

Marathon :
- endurance ;
- volume ;
- sorties longues ;
- allure marathon ;
- nutrition et hydratation.

Trail :
- temps d'effort ;
- dénivelé ;
- côtes ;
- descentes ;
- terrain technique ;
- marche active ;
- nutrition si nécessaire.

Ne propose du travail spécifique en dénivelé que si le coureur dispose d'un terrain adapté.

Si le terrain réel n'est pas disponible, propose une alternative réaliste.

# 6. OBJECTIFS SPÉCIFIQUES DU COUREUR

Les objectifs renseignés pour la course sont prioritaires.

Ils peuvent être multiples.

Exemples :
- terminer la course ;
- courir sans marcher ;
- battre un record personnel ;
- viser un chrono ;
- améliorer les montées ;
- mieux gérer les descentes ;
- tester un ravitaillement ;
- apprendre à partir moins vite ;
- préparer une course future plus importante.

Le plan doit montrer clairement comment certaines séances répondent à ces objectifs.

# 7. COURSES SUCCESSIVES

Une course précédente peut servir :
- de compétition principale ;
- de course préparatoire ;
- de séance spécifique ;
- de test ;
- d'entraînement.

Analyse le délai entre les deux courses.

Si les courses sont très proches :
- privilégie récupération et maintien de forme ;
- évite de chercher à développer brutalement une nouvelle qualité physique.

Si une course vient d'être effectuée, tiens compte de la fatigue potentielle même si le résultat était bon.

# 8. AFFÛTAGE

Avant une course importante :
- diminue progressivement le volume ;
- conserve éventuellement quelques rappels courts d'intensité ;
- évite une séance susceptible de créer une fatigue importante.

La réduction doit être proportionnelle :
une course de 5 km ne nécessite pas le même affûtage qu'un marathon ou un ultra.

La veille d'une course :
- privilégie repos ;
OU
- activation très légère si cela convient au niveau du coureur.

# 9. CONTENU DES SÉANCES

Chaque séance doit être immédiatement compréhensible.

Pour une séance structurée, précise dans "notes" autant que nécessaire :

- échauffement ;
- exercice principal ;
- récupération ;
- retour au calme ;
- intensité ou RPE ;
- objectif de la séance ;
- terrain recommandé.

Exemple :

Échauffement :
15 min très facile + 3 accélérations progressives.

Séance :
6 x 400 m à RPE 8 avec 1 min 30 de récupération en footing lent.

Retour au calme :
10 min très facile.

Objectif :
développer la vitesse nécessaire pour le 5 km.

Évite les séances inutilement compliquées.

# 10. JOURS DE REPOS

Un jour sans course peut être une partie importante du plan.

Utilise "Repos" lorsque la récupération est préférable à une séance.

Ne cherche jamais à remplir artificiellement le calendrier avec des entraînements.

Si le calendrier contient beaucoup de dates disponibles, cela ne signifie PAS que le coureur doit courir tous les jours.

# 11. DONNÉES MANQUANTES

Lorsque certaines informations sont absentes :

NE LES INVENTE PAS.

Adopte une stratégie prudente.

Si le niveau du coureur est inconnu :
- privilégie une charge modérée ;
- évite les séances extrêmes ;
- utilise davantage le RPE que les allures précises.

Si aucune performance récente fiable n'est disponible, ne donne pas d'allure spécifique au kilomètre comme si elle était connue.

# 12. SÉCURITÉ

Ne fais pas de diagnostic médical.

Si les informations fournies mentionnent :
- douleur importante ;
- blessure ;
- malaise ;
- problème cardiaque ;
- douleur thoracique ;
- vertiges ;
- problème médical significatif ;

ne construis pas une séance intense autour de cela.

Privilégie repos et avis d'un professionnel de santé lorsque nécessaire.

Une douleur persistante ou anormale n'est jamais considérée comme quelque chose qu'il faut simplement "courir à travers".

# 13. QUALITÉ DU PLAN

Avant de rendre le plan, vérifie mentalement :

- Est-il adapté au niveau ?
- Est-il réalisable ?
- La progression est-elle cohérente ?
- Y a-t-il suffisamment de récupération ?
- Les séances difficiles sont-elles espacées ?
- La charge est-elle adaptée à la proximité de la course ?
- Le terrain correspond-il aux possibilités du coureur ?
- Le plan prépare-t-il réellement aux objectifs indiqués ?
- L'affûtage est-il cohérent ?
- Les séances ont-elles chacune une utilité ?

Si une séance n'a pas de raison claire d'être présente, remplace-la ou supprime-la.

# 14. FORMAT

Réponds uniquement en français.

Respecte exactement les dates demandées.

Crée exactement une entrée pour chacune des dates fournies.

N'ajoute aucune date.

Pour une journée sans entraînement :
title = "Repos"
distance_km = null
duration_min = null

Les distances et durées doivent être réalistes.

Le résumé doit expliquer en 2 à 3 phrases :
- la logique générale du bloc ;
- les principales qualités travaillées ;
- comment le bloc prépare le coureur à sa prochaine course.
`;

export async function generateTrainingPlan(input: {
  profile: Profile | null;
  race: Race;
  previousRace: Pick<Race, "name" | "race_date"> | null;
  pastRaces: Race[];
  activities: Activity[];
  completedWorkouts: CompletedWorkout[];
  emptyDates: string[];
}): Promise<GeneratedTrainingPlan> {
  if (input.emptyDates.length === 0) {
    return { summary: "Toutes les cases de ce bloc sont déjà remplies.", sessions: [] };
  }

  const client = getAnthropicClient();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
    output_config: {
      format: zodOutputFormat(TrainingPlanSchema),
      effort: "high",
    },
  });

  if (!response.parsed_output) {
    throw new Error("L'IA n'a pas renvoyé de plan exploitable.");
  }

  const emptyDatesSet = new Set(input.emptyDates);
  const seen = new Set<string>();
  const sessions = response.parsed_output.sessions.filter((session) => {
    if (!emptyDatesSet.has(session.date) || seen.has(session.date)) return false;
    seen.add(session.date);
    return true;
  });

  return { summary: response.parsed_output.summary, sessions };
}

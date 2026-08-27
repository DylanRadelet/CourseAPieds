import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { formatMinutesToDuration, parseDurationToMinutes } from "@/lib/pace";
import { parseDistanceLabelToKm, scoreEffort, type LevelIndex } from "@/lib/level";
import type { Profile, Race } from "@/lib/types";

const RaceReportSchema = z.object({
  report: z
    .string()
    .describe(
      "Analyse courte (4-6 phrases) en français : comment cette performance se compare au niveau précédent du coureur, ce qu'elle révèle, et 1-2 conseils concrets pour la suite."
    ),
});

const SYSTEM_PROMPT = `Tu es un coach de course à pied qui commente la performance d'un coureur juste après une course qu'il vient de terminer.

Règles :
- Réponds uniquement en français, 4 à 6 phrases, ton factuel et encourageant mais honnête (ne survends pas une contre-performance).
- Compare explicitement cette course à son meilleur résultat précédent quand la donnée existe (indice de niveau avant/après).
- Si c'est sa première course chronométrée dans l'app, dis-le et pose cette performance comme référence de départ.
- Termine par 1 ou 2 conseils concrets et actionnables pour la suite de sa préparation.
- N'invente aucune donnée absente — reste prudent si l'historique est limité.`;

export async function generateRaceReport(input: {
  race: Race;
  profile: Profile | null;
  previousBest: LevelIndex | null;
}): Promise<{ report: string }> {
  const { race, profile, previousBest } = input;

  const distanceKm = parseDistanceLabelToKm(race.distance_label);
  const durationMin = race.result_time ? parseDurationToMinutes(race.result_time) : null;

  const lines: string[] = [];

  lines.push("## Course terminée");
  lines.push(`${race.name} — ${race.race_date}`);
  if (race.distance_label) lines.push(`Distance: ${race.distance_label}`);
  if (race.elevation_gain_m) lines.push(`D+: ${race.elevation_gain_m} m`);
  if (race.result_time) lines.push(`Temps: ${race.result_time}`);
  if (race.result_rank) lines.push(`Classement: ${race.result_rank}`);
  if (race.result_feeling) lines.push(`Ressenti: ${race.result_feeling}/5`);
  if (race.result_notes) lines.push(`Notes du coureur: ${race.result_notes}`);

  if (distanceKm && durationMin) {
    const thisEffort = scoreEffort(distanceKm, durationMin);
    lines.push("");
    lines.push(
      `Indice de niveau de CETTE course: ${thisEffort.score}/1000 (VDOT ≈ ${thisEffort.vdot}).`
    );
    if (previousBest) {
      lines.push(
        `Meilleur indice course précédent: ${previousBest.score}/1000 (VDOT ≈ ${previousBest.vdot}, sur "${previousBest.effort.label}" du ${previousBest.effort.date}, ${previousBest.effort.distanceKm} km en ${formatMinutesToDuration(previousBest.effort.durationMin)}).`
      );
      lines.push(`Écart: ${thisEffort.score - previousBest.score >= 0 ? "+" : ""}${thisEffort.score - previousBest.score} points.`);
    } else {
      lines.push("C'est la première course chronométrée enregistrée dans l'app.");
    }
  } else {
    lines.push("");
    lines.push(
      "Distance ou temps non exploitables pour calculer un indice précis (distance non numérique ou temps manquant) — commente uniquement à partir des infos qualitatives disponibles."
    );
  }

  if (profile?.objective) {
    lines.push("");
    lines.push(`Objectif général du coureur: ${profile.objective}`);
  }
  if (profile?.secondary_objective) {
    lines.push(`Objectif secondaire: ${profile.secondary_objective}`);
  }

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: lines.join("\n") }],
    output_config: {
      format: zodOutputFormat(RaceReportSchema),
      effort: "medium",
    },
  });

  if (!response.parsed_output) {
    throw new Error("L'IA n'a pas renvoyé de rapport exploitable.");
  }

  return response.parsed_output;
}

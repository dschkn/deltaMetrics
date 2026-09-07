import registry from "../data/questionnaires/registry.json";
import schedulingRules from "../data/questionnaires/scheduling-rules.json";
import labTriggerRules from "../data/questionnaires/lab-trigger-rules.json";

export type QuestionnaireId = (typeof registry.instruments)[number]["id"];

export type ScheduledQuestionnaire = {
  instrumentId: string;
  reasonRuleId: string;
  priority: number;
  dueAt: string;
  evidenceId?: string;
};

export type Completion = {
  instrumentId: string;
  completedAt: string;
  answers?: Record<string, number>;
  rawScore?: number;
  totalScore?: number;
};

export type DiaryPoint = {
  itemId: string;
  value: number;
  recordedAt: string;
};

export type LabObservation = {
  analyte: string;
  value: number;
  unit: string;
  observedAt: string;
  outsideSourceReferenceRange?: boolean;
  infectionOrInflammation?: boolean;
  ageYears?: number;
};

const DAY_MS = 86_400_000;

function daysBetween(earlier: string, later: string): number {
  return Math.floor((Date.parse(later) - Date.parse(earlier)) / DAY_MS);
}

function lastCompletion(completions: Completion[], instrumentId: string): Completion | undefined {
  return completions
    .filter((item) => item.instrumentId === instrumentId)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0];
}

function outsideCooldown(completions: Completion[], instrumentId: string, now: string, cooldownDays: number): boolean {
  const last = lastCompletion(completions, instrumentId);
  return !last || daysBetween(last.completedAt, now) >= cooldownDays;
}

function addOnce(queue: ScheduledQuestionnaire[], candidate: ScheduledQuestionnaire) {
  const existing = queue.find((item) => item.instrumentId === candidate.instrumentId);
  if (!existing) queue.push(candidate);
  else if (candidate.priority > existing.priority) Object.assign(existing, candidate);
}

export function scoreWho5(answers: Record<string, number>) {
  const itemIds = ["WHO5_1", "WHO5_2", "WHO5_3", "WHO5_4", "WHO5_5"];
  const values = itemIds.map((id) => answers[id]);
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 5)) return null;
  const rawScore = values.reduce((sum, value) => sum + value, 0);
  return {
    rawScore,
    normalizedScore: rawScore * 4,
    furtherAssessmentSuggested: rawScore < 13 || values.some((value) => value <= 1),
  };
}

export function scorePhq4(answers: Record<string, number>) {
  const anxietyIds = ["GAD2_1", "GAD2_2"];
  const depressionIds = ["PHQ2_1", "PHQ2_2"];
  const values = [...anxietyIds, ...depressionIds].map((id) => answers[id]);
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 3)) return null;
  const anxietyScore = anxietyIds.reduce((sum, id) => sum + answers[id], 0);
  const depressionScore = depressionIds.reduce((sum, id) => sum + answers[id], 0);
  const totalScore = anxietyScore + depressionScore;
  const severity = totalScore <= 2 ? "normal" : totalScore <= 5 ? "mild" : totalScore <= 8 ? "moderate" : "severe";
  return {
    totalScore,
    anxietyScore,
    depressionScore,
    severity,
    furtherAssessmentSuggested: anxietyScore >= 3 || depressionScore >= 3,
  };
}

function matchesLabRule(observation: LabObservation, rule: (typeof labTriggerRules.rules)[number]): boolean {
  const analytes = "analytes" in rule && Array.isArray(rule.analytes)
    ? rule.analytes
    : "analyte" in rule && typeof rule.analyte === "string" ? [rule.analyte] : [];
  if (!analytes.includes(observation.analyte)) return false;

  if ("condition" in rule) return rule.condition === "outside_report_specific_reference_range" && observation.outsideSourceReferenceRange === true;
  const minimumAge = "ageYears" in rule ? rule.ageYears?.min : undefined;
  if (typeof minimumAge === "number" && (observation.ageYears ?? 0) < minimumAge) return false;
  const inflammationRequirement = "requires" in rule ? rule.requires?.infectionOrInflammation : undefined;
  if (typeof inflammationRequirement === "boolean" && inflammationRequirement !== observation.infectionOrInflammation) return false;

  const sameUnit = rule.conditions.filter((condition) => condition.unit === observation.unit);
  if (!sameUnit.length) return false;
  const matches = sameUnit.map((condition) => condition.operator === "<"
    ? observation.value < condition.value
    : observation.value >= condition.value);
  return "conditionLogic" in rule && rule.conditionLogic === "same_unit_all" ? matches.every(Boolean) : matches.some(Boolean);
}

export function buildQuestionnaireQueue(input: {
  now: string;
  completions: Completion[];
  diary: DiaryPoint[];
  latestLabs: LabObservation[];
}): ScheduledQuestionnaire[] {
  const queue: ScheduledQuestionnaire[] = [];

  for (const rule of schedulingRules.rules) {
    const instrumentId = "instrumentId" in rule ? rule.instrumentId : undefined;
    const cadenceDays = "cadenceDays" in rule ? rule.cadenceDays : undefined;
    if (rule.type !== "calendar" || typeof instrumentId !== "string" || typeof cadenceDays !== "number") continue;
    const last = lastCompletion(input.completions, instrumentId);
    if (!last || daysBetween(last.completedAt, input.now) >= cadenceDays) {
      addOnce(queue, {instrumentId, reasonRuleId: rule.id, priority: rule.priority, dueAt: input.now});
    }
  }

  const lastWho5 = lastCompletion(input.completions, "who5-2024-en");
  if (lastWho5?.answers) {
    const score = scoreWho5(lastWho5.answers);
    if (score?.furtherAssessmentSuggested && outsideCooldown(input.completions, "phq4-2009-en", input.now, 14)) {
      addOnce(queue, {instrumentId: "phq4-2009-en", reasonRuleId: "who5_low_to_phq4", priority: 90, dueAt: input.now});
    }
  }

  const recentLowMood = input.diary.filter((point) =>
    point.itemId === "DM_DAY_MOOD" && point.value <= 3 && daysBetween(point.recordedAt, input.now) <= 7,
  ).length;
  if (recentLowMood >= 4 && outsideCooldown(input.completions, "phq4-2009-en", input.now, 14)) {
    addOnce(queue, {instrumentId: "phq4-2009-en", reasonRuleId: "persistent_low_mood", priority: 80, dueAt: input.now});
  }

  const lastPhq4 = lastCompletion(input.completions, "phq4-2009-en");
  if ((lastPhq4?.totalScore ?? -1) >= 6 && outsideCooldown(input.completions, "dm-distress-14-v1-ru", input.now, 14)) {
    addOnce(queue, {instrumentId: "dm-distress-14-v1-ru", reasonRuleId: "phq4_moderate_to_distress_detail", priority: 70, dueAt: input.now});
  }

  for (const observation of input.latestLabs) {
    for (const rule of labTriggerRules.rules) {
      if (!matchesLabRule(observation, rule)) continue;
      for (const instrumentId of rule.schedule) {
        addOnce(queue, {
          instrumentId,
          reasonRuleId: rule.id,
          priority: 60,
          dueAt: input.now,
          evidenceId: rule.evidenceId,
        });
      }
    }
  }

  return queue
    .sort((a, b) => b.priority - a.priority)
    .slice(0, schedulingRules.deliveryPolicy.maxScheduledInstrumentsPerDay);
}

export { registry, schedulingRules, labTriggerRules };

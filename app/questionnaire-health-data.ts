import type { HealthCategory, HealthItem } from "./health-data";

import who5 from "../data/questionnaires/WHO-5/who5.en.json";
import phq4 from "../data/questionnaires/PHQ-4/phq4.en.json";
import dailyCheckIn from "../data/questionnaires/daily-check-in/daily-check-in.ru.json";
import global10 from "../data/questionnaires/DM-Global-10/dm-global-10.ru.json";
import distress14 from "../data/questionnaires/DM-Distress-14/dm-distress-14.ru.json";

type Questionnaire = {
  name: string;
  items: Array<{ text: string }>;
  responseScale: Array<{ value: number; label: string }> | { min: number; max: number; step: number };
  schedule: { defaultCadenceDays: number | null; triggeredOnly?: boolean };
};

function scaleLabel(scale: Questionnaire["responseScale"]): string {
  if (Array.isArray(scale)) {
    return scale
      .slice()
      .sort((a, b) => a.value - b.value)
      .map((option) => `${option.value} — ${option.label}`)
      .join("; ");
  }
  return `${scale.min}–${scale.max}, шаг ${scale.step}`;
}

function cadenceLabel(schedule: Questionnaire["schedule"]): string {
  if (schedule.triggeredOnly || schedule.defaultCadenceDays === null) return "по показаниям";
  if (schedule.defaultCadenceDays === 1) return "ежедневно";
  if (schedule.defaultCadenceDays === 14) return "раз в 2 недели";
  if (schedule.defaultCadenceDays === 30) return "раз в месяц";
  return `каждые ${schedule.defaultCadenceDays} дней`;
}

function toCategory(questionnaire: Questionnaire, dateCount: number): HealthCategory {
  const reference = `Шкала: ${scaleLabel(questionnaire.responseScale)}. Периодичность: ${cadenceLabel(questionnaire.schedule)}.`;
  const items: HealthItem[] = questionnaire.items.map((item) => ({
    name: item.text,
    unit: "балл",
    values: Array(dateCount).fill(null),
    reference,
  }));

  return { name: questionnaire.name, items };
}

export function buildQuestionnaireHealthCategories(dateCount: number): HealthCategory[] {
  return [who5, phq4, dailyCheckIn, global10, distress14]
    .map((questionnaire) => toCategory(questionnaire as Questionnaire, dateCount));
}


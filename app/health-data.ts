export type HealthItem = {
  name: string;
  unit: string;
  values: (string | null)[];
  reference: string;
};

export type HealthCategory = {
  name: string;
  items: HealthItem[];
};

// Public demo fixtures only. Real observations, dates, documents, and profile
// data will be loaded from the server API and must never be committed to git.
export const dates = ["15.01.2024", "22.07.2024", "18.02.2025", "12.08.2026"] as const;

export const healthCategories: HealthCategory[] = [
  {
    name: "Общий анализ мочи",
    items: [
      { name: "Цвет", unit: "", values: ["Светло-жёлтый", "Жёлтый", "Светло-жёлтый", "Светло-жёлтый"], reference: "от светло-жёлтого до жёлтого" },
      { name: "Удельный вес", unit: "", values: ["1.018", "1.021", "1.016", "1.019"], reference: "1.005–1.030" },
      { name: "pH", unit: "", values: ["6.0", "5.8", "6.2", "6.1"], reference: "5.0–7.0" },
      { name: "Белок", unit: "г/л", values: ["Отрицательно", "Отрицательно", "Отрицательно", "Отрицательно"], reference: "Отрицательно" },
      { name: "Глюкоза", unit: "", values: ["Отрицательно", "Отрицательно", "Отрицательно", "Отрицательно"], reference: "Отрицательно" },
    ],
  },
  {
    name: "Общий анализ крови",
    items: [
      { name: "Лейкоциты (WBC)", unit: "10^9/л", values: ["5.2", "5.6", "5.1", "5.4"], reference: "4.0–9.0" },
      { name: "Эритроциты (RBC)", unit: "10^12/л", values: ["4.72", "4.81", "4.77", "4.84"], reference: "4.0–5.5" },
      { name: "Гемоглобин (HGB)", unit: "г/л", values: ["148", "151", "149", "153"], reference: "130–170" },
      { name: "Гематокрит (HCT)", unit: "%", values: ["43.8", "44.2", "43.5", "44.7"], reference: "40–50" },
      { name: "Тромбоциты (PLT)", unit: "10^9/л", values: ["226", "219", "231", "224"], reference: "150–400" },
      { name: "СОЭ", unit: "мм/ч", values: ["4", "5", "4", "6"], reference: "2–15" },
    ],
  },
  {
    name: "Биохимический анализ крови",
    items: [
      { name: "Глюкоза", unit: "ммоль/л", values: ["4.8", "5.0", "4.7", "4.9"], reference: "3.9–6.1" },
      { name: "Креатинин", unit: "мкмоль/л", values: ["82", "79", "84", "81"], reference: "62–106" },
      { name: "АЛТ", unit: "Ед/л", values: ["22", "25", "21", "24"], reference: "0–41" },
      { name: "АСТ", unit: "Ед/л", values: ["20", "23", "19", "22"], reference: "0–40" },
      { name: "С-реактивный белок", unit: "мг/л", values: ["1.1", "1.4", "1.0", "1.2"], reference: "0–5" },
    ],
  },
  {
    name: "Липидный профиль",
    items: [
      { name: "Общий холестерин", unit: "ммоль/л", values: ["4.72", "4.91", "4.63", "4.78"], reference: "0–5.2" },
      { name: "ЛПНП", unit: "ммоль/л", values: ["2.68", "2.82", "2.54", "2.66"], reference: "0–3.0" },
      { name: "ЛПВП", unit: "ммоль/л", values: ["1.34", "1.29", "1.38", "1.36"], reference: "1.0–2.1" },
      { name: "Триглицериды", unit: "ммоль/л", values: ["1.08", "1.16", "0.98", "1.04"], reference: "0–1.7" },
    ],
  },
  {
    name: "Гормоны щитовидной железы",
    items: [
      { name: "ТТГ", unit: "мМЕ/л", values: ["1.82", "1.74", "1.91", "1.79"], reference: "0.4–4.0" },
      { name: "Т4 свободный", unit: "пмоль/л", values: ["14.8", "15.1", "14.6", "15.0"], reference: "9–19" },
      { name: "АТ-ТПО", unit: "МЕ/мл", values: ["8", null, "7", "8"], reference: "0–34" },
    ],
  },
  {
    name: "Копрограмма",
    items: [
      { name: "Консистенция", unit: "", values: ["Оформленный", null, "Оформленный", "Оформленный"], reference: "Оформленный" },
      { name: "Скрытая кровь", unit: "", values: ["Отрицательно", null, "Отрицательно", "Отрицательно"], reference: "Отрицательно" },
      { name: "Крахмал", unit: "", values: ["Не обнаружен", null, "Не обнаружен", "Не обнаружен"], reference: "Не обнаружен" },
    ],
  },
  {
    name: "Микробиологическое исследование кала",
    items: [
      { name: "Патогенные энтеробактерии", unit: "", values: ["Не обнаружены", null, "Не обнаружены", "Не обнаружены"], reference: "Не обнаружены" },
      { name: "Дрожжеподобные грибы", unit: "КОЕ/г", values: ["<10^3", null, "<10^3", "<10^3"], reference: "до 10^4" },
    ],
  },
  {
    name: "Посев эякулята и чувствительность к антибиотикам",
    items: [
      { name: "Рост микрофлоры", unit: "", values: [null, "Не обнаружен", null, "Не обнаружен"], reference: "Не обнаружен" },
      { name: "Лейкоциты", unit: "в п/зр", values: [null, "1–2", null, "0–1"], reference: "0–5" },
    ],
  },
  {
    name: "Посев из зева и чувствительность к антибиотикам",
    items: [
      { name: "Staphylococcus aureus", unit: "КОЕ/мл", values: ["Не обнаружен", null, null, "Не обнаружен"], reference: "Не обнаружен" },
      { name: "Streptococcus pyogenes", unit: "КОЕ/мл", values: ["Не обнаружен", null, null, "Не обнаружен"], reference: "Не обнаружен" },
    ],
  },
  {
    name: "Осмотр / неотложная помощь",
    items: [
      { name: "Артериальное давление", unit: "мм рт. ст.", values: ["118/76", "121/78", "116/74", "119/77"], reference: "Оценка врачом" },
      { name: "Частота пульса", unit: "уд/мин", values: ["68", "72", "66", "70"], reference: "60–90" },
    ],
  },
  {
    name: "ЭКГ",
    items: [
      { name: "Ритм", unit: "", values: ["Синусовый", null, "Синусовый", "Синусовый"], reference: "Синусовый" },
      { name: "ЧСС", unit: "уд/мин", values: ["67", null, "64", "69"], reference: "60–90" },
      { name: "Интервал PR", unit: "мс", values: ["154", null, "158", "156"], reference: "120–200" },
    ],
  },
  {
    name: "УЗИ мочевого пузыря, почек и простаты",
    items: [
      { name: "Почки", unit: "", values: [null, "Без особенностей", null, "Без особенностей"], reference: "Оценка врачом" },
      { name: "Мочевой пузырь", unit: "", values: [null, "Без особенностей", null, "Без особенностей"], reference: "Оценка врачом" },
      { name: "Остаточная моча", unit: "мл", values: [null, "18", null, "16"], reference: "0–50" },
    ],
  },
  {
    name: "Рентген / флюорография органов грудной клетки",
    items: [
      { name: "Заключение", unit: "", values: ["Без очаговых изменений", null, null, "Без очаговых изменений"], reference: "Оценка врачом" },
    ],
  },
  {
    name: "InBody - состав тела",
    items: [
      { name: "Вес", unit: "кг", values: ["71.2", "70.4", "69.8", "68.9"], reference: "Индивидуальная динамика" },
      { name: "Масса скелетной мускулатуры", unit: "кг", values: ["29.8", "30.1", "30.3", "30.6"], reference: "Оценка прибора" },
      { name: "Масса жира", unit: "кг", values: ["16.2", "15.4", "14.8", "13.9"], reference: "Оценка прибора" },
      { name: "Процент жира", unit: "%", values: ["22.8", "21.9", "21.2", "20.2"], reference: "10–20" },
      { name: "ИМТ", unit: "кг/м²", values: ["24.6", "24.3", "24.1", "23.8"], reference: "18.5–25" },
      { name: "Висцеральный жир", unit: "уровень", values: ["7", "7", "6", "6"], reference: "1–9" },
      { name: "Базальный метаболизм", unit: "ккал", values: ["1580", "1591", "1602", "1610"], reference: "Оценка прибора" },
    ],
  },
  {
    name: "InBody - сегментарный анализ",
    items: [
      { name: "Тощая масса правой руки", unit: "% нормы", values: ["102", "104", "105", "106"], reference: "90–110" },
      { name: "Тощая масса левой руки", unit: "% нормы", values: ["101", "103", "104", "105"], reference: "90–110" },
      { name: "Тощая масса туловища", unit: "% нормы", values: ["103", "104", "105", "106"], reference: "90–110" },
      { name: "Тощая масса правой ноги", unit: "% нормы", values: ["98", "99", "100", "101"], reference: "90–110" },
      { name: "Тощая масса левой ноги", unit: "% нормы", values: ["98", "99", "100", "101"], reference: "90–110" },
    ],
  },
];

export const sourceDocuments = [
  { type: "PDF", subtitle: "Демонстрационный источник", title: "Общий анализ крови", dates: "12 августа 2026" },
  { type: "PDF", subtitle: "Демонстрационный источник", title: "Биохимия и липиды", dates: "12 августа 2026" },
  { type: "JPG", subtitle: "Демонстрационный источник", title: "InBody", dates: "12 августа 2026" },
  { type: "PDF", subtitle: "Демонстрационный источник", title: "ЭКГ", dates: "18 февраля 2025" },
  { type: "PDF", subtitle: "Демонстрационный источник", title: "УЗИ", dates: "22 июля 2024" },
] as const;

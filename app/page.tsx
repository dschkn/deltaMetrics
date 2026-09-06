"use client";

import { useEffect, useMemo, useState } from "react";
import { dates, healthCategories, sourceDocuments, type HealthItem } from "./health-data";

type Status = "normal" | "warning" | "danger" | "neutral";
type View = "results" | "documents" | "profile" | "settings";

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo1234";
const SESSION_KEY = "deltametrics.demo-session";

const short: Record<string, string> = {
  "Общий анализ мочи": "Моча",
  "Общий анализ крови": "Кровь",
  "Биохимический анализ крови": "Биохимия",
  "Липидный профиль": "Липиды",
  "Гормоны щитовидной железы": "Гормоны",
  "Копрограмма": "Копрограмма",
  "Микробиологическое исследование кала": "Микробиология",
  "Посев эякулята и чувствительность к антибиотикам": "Посев эякулята",
  "Посев из зева и чувствительность к антибиотикам": "Посев из зева",
  "Осмотр / неотложная помощь": "Осмотр",
  "ЭКГ": "ЭКГ",
  "УЗИ мочевого пузыря, почек и простаты": "УЗИ",
  "Рентген / флюорография органов грудной клетки": "Рентген / ФЛГ",
  "InBody - состав тела": "InBody",
  "InBody - сегментарный анализ": "InBody · сегменты",
};

const totalIndicators = healthCategories.reduce((sum, category) => sum + category.items.length, 0);
const totalDocuments = sourceDocuments.length;
const lastUpdateLabel = "12 августа 2026";

function Icon({ name, size = 18 }: { name: "grid" | "search" | "upload" | "filter" | "chevron" | "chart" | "close" | "more" | "shield" | "file" | "settings" | "plus" | "user" | "logout" | "lock"; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    chart: <><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-5 3 3 5-7"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    logout: <><path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4M18 12H9"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function extractReference(reference: string, date: string) {
  if (!reference.includes("\n")) return reference;
  const line = reference.split("\n").find((part) => part.includes(date));
  return line ? line.split(":").slice(1).join(":").trim() : reference;
}

function cellStatus(value: string | null, reference: string, date: string): Status {
  if (!value || !reference) return "neutral";
  const ref = extractReference(reference, date).toLowerCase();
  const clean = value.trim().toLowerCase();
  if ((ref.includes("отриц") || ref.includes("не обнаруж")) && (clean.includes("полож") || /^\+{1,3}$/.test(clean))) return clean.includes("полож") || clean.length > 1 ? "danger" : "warning";
  if (clean === ref || (clean.length > 3 && ref.includes(clean))) return "normal";
  if ((ref.includes("не обнаруж") || ref.includes("отсутств")) && !(clean.includes("не обнаруж") || clean.includes("отсутств") || clean === "нет" || clean === "0.")) return "warning";
  if (ref.startsWith("до +") && /^\+{1,3}$/.test(clean)) return clean.length > 1 ? "warning" : "normal";
  const valueNum = Number.parseFloat(clean.replace(",", "."));
  if (!Number.isFinite(valueNum) || /% нормы|оценка прибора/i.test(ref)) return "neutral";
  const nums = [...ref.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number.parseFloat(m[0].replace(",", ".")));
  if (nums.length >= 2 && !ref.includes("×10")) {
    const min = nums[nums.length - 2];
    const max = nums[nums.length - 1];
    if (valueNum >= min && valueNum <= max) return "normal";
    const span = Math.max(max - min, Math.abs(max) * 0.1, 1);
    return valueNum < min - span * 0.35 || valueNum > max + span * 0.35 ? "danger" : "warning";
  }
  if ((ref.startsWith("до ") || ref.startsWith("<") || ref.startsWith("≤")) && nums.length) return valueNum <= nums[0] ? "normal" : "warning";
  return "neutral";
}

function Sparkline({ item }: { item: HealthItem }) {
  const points = item.values.map((value, index) => ({ value: value ? Number.parseFloat(value.replace(",", ".")) : NaN, index })).filter((point) => Number.isFinite(point.value));
  if (points.length < 2) return <div className="empty-chart"><Icon name="chart" size={22}/><span>Для графика нужны минимум две даты</span></div>;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const span = max - min || 1;
  const y = (value: number) => 136 - ((value - min) / span) * 96;
  const svgPoints = points.map((point) => `${24 + point.index * 73},${y(point.value)}`).join(" ");
  return <div className="chart-wrap"><svg viewBox="0 0 500 170" role="img" aria-label={`Динамика показателя ${item.name}`}>
    {[40,88,136].map((lineY) => <line key={lineY} x1="24" y1={lineY} x2="462" y2={lineY} className="chart-grid" />)}
    <polyline points={svgPoints} fill="none" stroke="#78c800" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
    {points.map((point) => <g key={point.index}><circle cx={24 + point.index * 73} cy={y(point.value)} r="5" fill="#fff" stroke="#78c800" strokeWidth="3"/><text x={24 + point.index * 73} y="156" textAnchor="middle" className="chart-label">{dates[point.index].slice(-4)}</text></g>)}
  </svg></div>;
}

function LoginScreen({ login, password, error, setLogin, setPassword, onSubmit }: { login: string; password: string; error: string; setLogin: (value: string) => void; setPassword: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <main className="auth-screen">
    <div className="auth-ambient ambient-one"/><div className="auth-ambient ambient-two"/>
    <section className="auth-panel">
      <div className="auth-brand"><span className="brand-mark"><span className="delta-mark">Δ</span></span><span>DeltaMetrics</span></div>
      <div className="auth-copy"><p className="eyebrow">Личный медицинский архив</p><h1>Данные здоровья<br/>в динамике.</h1><p>Результаты анализов, референсные диапазоны и исследования — в одном спокойном интерфейсе.</p></div>
      <form className="login-form" onSubmit={onSubmit}>
        <label><span>Логин</span><input autoComplete="username" value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Введите логин"/></label>
        <label><span>Пароль</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Введите пароль"/></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit"><Icon name="lock" size={17}/>Войти</button>
        <p className="auth-demo-credentials">
          Тестовый логин: <code>{DEMO_USERNAME}</code><span aria-hidden="true">·</span>Тестовый пароль: <code>{DEMO_PASSWORD}</code>
        </p>
      </form>
      <p className="auth-footnote">demo fixtures · server authentication will be added next</p>
    </section>
    <aside className="auth-visual" aria-hidden="true"><div className="visual-card card-a"><span>Холестерин · demo</span><b>4.78</b><i>ммоль/л</i><svg viewBox="0 0 180 45"><path d="M2 38C28 38 31 29 49 30s24 7 40-4 23-17 39-9 19 11 50-13"/></svg></div><div className="visual-card card-b"><span>История данных</span><b>2024—2026</b><div className="mini-bars">{[3,5,4,8,7,11,9,14,13,18,16,22].map((height,index) => <i key={index} style={{height: height + 5}}/>)}</div></div><div className="visual-orbit"><span>{totalIndicators}</span><small>показателей</small></div></aside>
  </main>;
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<View>("results");
  const [activeCategory, setActiveCategory] = useState("Все результаты");
  const [query, setQuery] = useState("");
  const [outliersOnly, setOutliersOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HealthItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState(healthCategories[0].name);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<Record<string, HealthItem[]>>({});
  const [draftCategory, setDraftCategory] = useState("");
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newAnalyteOpen, setNewAnalyteOpen] = useState(false);
  const [draftAnalyte, setDraftAnalyte] = useState({ name: "", unit: "", reference: "" });

  useEffect(() => {
    setAuthenticated(window.sessionStorage.getItem(SESSION_KEY) === DEMO_USERNAME);
    setSessionReady(true);
  }, []);

  const visibleCategories = useMemo(() => healthCategories
    .filter((category) => activeCategory === "Все результаты" || category.name === activeCategory)
    .map((category) => ({ ...category, items: category.items.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
      const hasOutlier = item.values.some((value, index) => ["warning", "danger"].includes(cellStatus(value, item.reference, dates[index])));
      return matchesQuery && (!outliersOnly || hasOutlier);
    }) }))
    .filter((category) => category.items.length > 0), [activeCategory, query, outliersOnly]);

  const visibleCount = visibleCategories.reduce((sum, category) => sum + category.items.length, 0);
  const pageTitle = view === "documents" ? "Документы" : view === "profile" ? "Профиль" : view === "settings" ? "Настройки справочника" : activeCategory === "Все результаты" ? "Все результаты" : short[activeCategory];

  const signOut = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    setPassword("");
    setView("results");
  };

  if (!sessionReady) return <main className="auth-screen"><div className="auth-loading"><span className="delta-glyph">Δ</span></div></main>;

  if (!authenticated) return <LoginScreen login={login} password={password} error={loginError} setLogin={setLogin} setPassword={setPassword} onSubmit={(event) => {
    event.preventDefault();
    if (login.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      window.sessionStorage.setItem(SESSION_KEY, DEMO_USERNAME);
      setAuthenticated(true);
      setLoginError("");
      return;
    }
    setLoginError("Не получилось войти. Проверьте логин и пароль.");
  }}/>;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><span className="delta-mark">Δ</span></span><span>DeltaMetrics</span></div>
      <nav className="primary-nav" aria-label="Основные разделы">
        <button className={view === "results" ? "nav-item active" : "nav-item"} onClick={() => setView("results")}><Icon name="grid"/><span>Результаты</span></button>
        <button className={view === "documents" ? "nav-item active" : "nav-item"} onClick={() => setView("documents")}><Icon name="file"/><span>Документы</span><em>{totalDocuments}</em></button>
        <button className={view === "profile" ? "nav-item active" : "nav-item"} onClick={() => setView("profile")}><Icon name="user"/><span>Профиль</span></button>
        <button className={view === "settings" ? "nav-item active" : "nav-item"} onClick={() => setView("settings")}><Icon name="settings"/><span>Настройки</span></button>
      </nav>
      <div className="sidebar-note"><Icon name="shield"/><div><b>Личный архив</b><span>данные хранятся приватно</span></div></div>
    </aside>

    <section className="workspace">
      <header className="topbar">
        <div><p className="eyebrow">Демонстрационный архив</p><h1>{pageTitle}</h1></div>
        <div className="header-actions"><button className="icon-button" aria-label="Дополнительные действия"><Icon name="more"/></button><button className="avatar" onClick={() => setView("profile")} aria-label="Открыть демонстрационный профиль">DM</button></div>
      </header>

      {view === "results" && <>
      <nav className="category-nav" aria-label="Категории анализов">
        <p className="nav-label">категории</p>
        <button className={activeCategory === "Все результаты" ? "nav-item active" : "nav-item"} onClick={() => setActiveCategory("Все результаты")}><span>Все результаты</span><em>{healthCategories.reduce((sum, c) => sum + c.items.length, 0)}</em></button>
        {healthCategories.map((category) => <button key={category.name} className={activeCategory === category.name ? "nav-item active" : "nav-item"} onClick={() => setActiveCategory(category.name)}><span>{short[category.name] ?? category.name}</span><em>{category.items.length}</em></button>)}
      </nav>
      <div className="toolbar">
        <label className="search"><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти показатель" aria-label="Найти показатель"/><kbd>⌘ K</kbd></label>
        <button className={outliersOnly ? "filter-button active" : "filter-button"} onClick={() => setOutliersOnly((value) => !value)}><Icon name="filter"/>Отклонения<span className="toggle-dot"/></button>
        <div className="toolbar-spacer"/>
        <div className="legend"><span><i className="dot normal"/>в норме</span><span><i className="dot warning"/>погранично</span><span><i className="dot danger"/>вне нормы</span></div>
        <button className="upload-button" onClick={() => setUploadOpen(true)}><Icon name="upload"/>Загрузить PDF</button>
      </div>

      <div className="matrix-card">
        <div className="matrix-meta"><span>{visibleCount} показателей</span><span>{dates.length} даты</span><span>обновлено {lastUpdateLabel}</span></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th className="sticky-col indicator-col">Показатель</th><th className="unit-col">Ед.</th>{dates.map((date) => <th key={date}><span>{date.slice(0, 5)}</span><small>{date.slice(-4)}</small></th>)}<th className="reference-col">Референс</th></tr></thead>
            <tbody>{visibleCategories.map((category) => <CategoryRows key={category.name} category={category} onSelect={setSelectedItem}/>)}</tbody>
          </table>
        </div>
        <div className="scroll-hint"><span>←</span> горизонтальная шкала времени <span>→</span></div>
      </div></>}

      {view === "documents" && <DocumentsView onUpload={() => setUploadOpen(true)}/>}
      {view === "profile" && <ProfileView onSignOut={signOut}/>}
      {view === "settings" && <SettingsView selected={settingsCategory} setSelected={setSettingsCategory} customCategories={customCategories} customItems={customItems} onAdd={() => setNewCategoryOpen(true)} onAddAnalyte={() => setNewAnalyteOpen(true)}/>}
    </section>

    {selectedItem && <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedItem(null)}><aside className="detail-drawer" aria-label={`Детали: ${selectedItem.name}`}><button className="drawer-close" onClick={() => setSelectedItem(null)} aria-label="Закрыть"><Icon name="close"/></button><p className="eyebrow">Динамика показателя</p><h2>{selectedItem.name}</h2><p className="drawer-unit">{selectedItem.unit || "Качественный показатель"}</p><Sparkline item={selectedItem}/><div className="history-list">{dates.map((date, index) => selectedItem.values[index] && <div key={date}><span>{date}</span><b className={`status-text ${cellStatus(selectedItem.values[index], selectedItem.reference, date)}`}>{selectedItem.values[index]} {selectedItem.unit}</b></div>)}</div><div className="reference-box"><span>Референс</span><p>{selectedItem.reference || "Не указан в источнике"}</p></div><button className="secondary-button">Открыть источник</button></aside></div>}

    {uploadOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setUploadOpen(false)}><div className="upload-modal"><button className="drawer-close" onClick={() => setUploadOpen(false)} aria-label="Закрыть"><Icon name="close"/></button><span className="modal-icon"><Icon name="upload" size={26}/></span><h2>Новый результат</h2><p>Добавьте PDF или фотографию бланка. В прототипе файл появится на экране проверки, но пока не сохраняется.</p><label className="dropzone"><input type="file" accept=".pdf,image/*" onChange={() => setUploadOpen(false)}/><b>Перетащите файл сюда</b><span>или нажмите, чтобы выбрать · до 25 МБ</span></label><button className="secondary-button" onClick={() => setUploadOpen(false)}>Отмена</button></div></div>}
    {newCategoryOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setNewCategoryOpen(false)}><form className="upload-modal" onSubmit={(event) => { event.preventDefault(); if (draftCategory.trim()) { setCustomCategories((items) => [...items, draftCategory.trim()]); setSettingsCategory(draftCategory.trim()); setDraftCategory(""); setNewCategoryOpen(false); } }}><button type="button" className="drawer-close" onClick={() => setNewCategoryOpen(false)} aria-label="Закрыть"><Icon name="close"/></button><span className="modal-icon"><Icon name="plus" size={25}/></span><h2>Новая категория</h2><p>Категория появится в локальном прототипе. В backend-версии это будет обычный CRUD через Spring Boot.</p><label className="field-label">Название<input autoFocus value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)} placeholder="Например, Витамины"/></label><button className="upload-button form-submit" type="submit">Добавить категорию</button></form></div>}
    {newAnalyteOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setNewAnalyteOpen(false)}><form className="upload-modal analyte-modal" onSubmit={(event) => { event.preventDefault(); if (!draftAnalyte.name.trim()) return; const item: HealthItem = { name: draftAnalyte.name.trim(), unit: draftAnalyte.unit.trim(), reference: draftAnalyte.reference.trim(), values: Array(dates.length).fill(null) }; setCustomItems((items) => ({ ...items, [settingsCategory]: [...(items[settingsCategory] ?? []), item] })); setDraftAnalyte({ name: "", unit: "", reference: "" }); setNewAnalyteOpen(false); }}><button type="button" className="drawer-close" onClick={() => setNewAnalyteOpen(false)} aria-label="Закрыть"><Icon name="close"/></button><span className="modal-icon"><Icon name="chart" size={25}/></span><h2>Новый показатель</h2><p>{settingsCategory}</p><label className="field-label">Название<input autoFocus value={draftAnalyte.name} onChange={(event) => setDraftAnalyte((item) => ({ ...item, name: event.target.value }))} placeholder="Например, Витамин D"/></label><div className="two-fields"><label className="field-label">Единица<input value={draftAnalyte.unit} onChange={(event) => setDraftAnalyte((item) => ({ ...item, unit: event.target.value }))} placeholder="нг/мл"/></label><label className="field-label">Референс<input value={draftAnalyte.reference} onChange={(event) => setDraftAnalyte((item) => ({ ...item, reference: event.target.value }))} placeholder="30–100"/></label></div><button className="upload-button form-submit" type="submit">Добавить показатель</button></form></div>}
  </main>;
}

function ProfileView({ onSignOut }: { onSignOut: () => void }) {
  return <section className="profile-view">
    <div className="profile-hero">
      <div className="profile-avatar">DM</div>
      <div className="profile-identity"><p className="eyebrow">Демо-профиль</p><h2>DeltaMetrics User</h2><span>Публичные тестовые данные</span></div>
      <button className="secondary-button profile-edit">Редактировать профиль</button>
    </div>
    <div className="profile-grid">
      <article className="profile-card identity-card"><p className="eyebrow">Основные данные</p><dl><div><dt>Режим</dt><dd>Demo</dd></div><div><dt>Персональные данные</dt><dd>Не загружены</dd></div><div><dt>Источник</dt><dd>Fixtures</dd></div><div><dt>Язык</dt><dd>Русский</dd></div></dl></article>
      <article className="profile-card archive-card"><p className="eyebrow">Архив</p><div className="profile-stats"><div><strong>{totalIndicators}</strong><span>показателей</span></div><div><strong>{dates.length}</strong><span>даты</span></div><div><strong>{totalDocuments}</strong><span>документов</span></div></div><p className="profile-muted">Последнее обновление: {lastUpdateLabel}</p></article>
      <article className="profile-card access-card"><span className="modal-icon"><Icon name="shield" size={22}/></span><div><p className="eyebrow">Доступ</p><h3>Без персональных данных</h3><p>В git хранится только демонстрационный набор. Настоящие профили, сессии и медицинские данные будут загружаться из защищённого backend API.</p></div></article>
      <article className="profile-card account-card"><div><p className="eyebrow">Учётная запись</p><h3>demo</h3><p>Локальная демонстрационная сессия</p></div><button className="signout-button" onClick={onSignOut}><Icon name="logout" size={17}/>Выйти</button></article>
    </div>
  </section>;
}

function DocumentsView({ onUpload }: { onUpload: () => void }) {
  return <section className="content-view">
    <div className="view-intro"><div><p>{totalDocuments} демонстрационных файлов</p><span>Каждое значение можно связать с конкретным документом и страницей.</span></div><button className="upload-button" onClick={onUpload}><Icon name="upload"/>Добавить документ</button></div>
    <div className="document-grid">
      {sourceDocuments.map((document, index) => <article className="document-card" key={document.title}>
        <div className="file-preview"><span>{document.type}</span><Icon name="file" size={34}/><i>{index + 1}</i></div>
        <div className="file-copy"><p>{document.subtitle}</p><h2>{document.title}</h2><span>{document.dates}</span></div>
        <button className="icon-button" aria-label={`Действия с документом ${document.title}`}><Icon name="more"/></button>
      </article>)}
    </div>
    <div className="import-note"><span className="modal-icon"><Icon name="shield" size={22}/></span><div><h3>Импорт с проверкой человеком</h3><p>Будущая версия распознает PDF, сопоставит названия показателей со справочником и попросит подтвердить значения до сохранения.</p></div><span className="prototype-badge">план backend</span></div>
  </section>;
}

function SettingsView({ selected, setSelected, customCategories, customItems, onAdd, onAddAnalyte }: { selected: string; setSelected: (value: string) => void; customCategories: string[]; customItems: Record<string, HealthItem[]>; onAdd: () => void; onAddAnalyte: () => void }) {
  const allCategories = [...healthCategories.map((category) => category.name), ...customCategories];
  const category = healthCategories.find((item) => item.name === selected);
  const items = [...(customItems[selected] ?? []), ...(category?.items ?? [])];
  return <section className="settings-view">
    <div className="settings-sidebar">
      <div className="settings-heading"><div><p className="eyebrow">Структура</p><h2>Категории</h2></div><button className="mini-add" onClick={onAdd} aria-label="Добавить категорию"><Icon name="plus" size={16}/></button></div>
      <div className="settings-list">{allCategories.map((name) => <button key={name} className={selected === name ? "active" : ""} onClick={() => setSelected(name)}><span>{short[name] ?? name}</span><em>{(healthCategories.find((item) => item.name === name)?.items.length ?? 0) + (customItems[name]?.length ?? 0)}</em></button>)}</div>
    </div>
    <div className="settings-editor">
      <div className="editor-head"><div><p className="eyebrow">Категория</p><h2>{selected}</h2><span>{items.length ? `${items.length} показателей` : "Новая пустая категория"}</span></div><button className="filter-button">Изменить</button></div>
      <div className="dictionary-table">
        <div className="dictionary-head"><span>Показатель</span><span>Единица</span><span>Референс</span></div>
        {items.slice(0, 12).map((item) => <button key={item.name}><strong>{item.name}</strong><span>{item.unit || "качественный"}</span><span>{item.reference || "не задан"}</span><Icon name="chevron" size={15}/></button>)}
        {!items.length && <div className="empty-settings"><Icon name="settings" size={28}/><p>Здесь появятся показатели категории</p><span>Добавьте название, единицу измерения, тип значения и правила референса.</span></div>}
      </div>
      <button className="add-analyte" onClick={onAddAnalyte}><Icon name="plus" size={17}/>Добавить показатель</button>
    </div>
  </section>;
}

function CategoryRows({ category, onSelect }: { category: { name: string; items: HealthItem[] }; onSelect: (item: HealthItem) => void }) {
  const [open, setOpen] = useState(true);
  return <><tr className="category-row"><td className="sticky-col"><button onClick={() => setOpen((value) => !value)}><span className={open ? "chevron open" : "chevron"}><Icon name="chevron" size={15}/></span>{category.name}<em>{category.items.length}</em></button></td><td className="unit-col"/><td colSpan={dates.length + 1}/></tr>{open && category.items.map((item) => <tr className="data-row" key={`${category.name}-${item.name}`} onClick={() => onSelect(item)}><td className="sticky-col indicator-col"><div className="indicator-content"><span>{item.name}</span><Icon name="chart" size={15}/></div></td><td className="unit-col">{item.unit || "—"}</td>{item.values.map((value, index) => <td key={dates[index]}><span className={`value-pill ${cellStatus(value, item.reference, dates[index])}`}>{value ?? ""}</span></td>)}<td className="reference-col"><span title={item.reference}>{item.reference || "—"}</span></td></tr>)}</>;
}

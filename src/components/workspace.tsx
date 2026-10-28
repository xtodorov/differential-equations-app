"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Braces,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Code2,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Moon,
  Play,
  RotateCcw,
  Settings,
  Sigma,
  Sparkles,
  Sun,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Formula } from "./math";
import type { LessonContent } from "@/lib/types";
const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => <p>Зареждане на редактора…</p>,
});
const Graph = dynamic(() => import("./graph"), {
  ssr: false,
  loading: () => <p>Зареждане на графиката…</p>,
});
type LessonSummary = {
  id: string;
  title: string;
  description: string;
  track: string;
  module: string;
  minutes: number;
  prerequisiteId: string | null;
  _count: { exercises: number };
};
type Profile = {
  level: string;
  derivatives: boolean;
  integrals: boolean;
  equations: boolean;
  wolfram: boolean;
  subject: string;
  examDate: string;
  grade: number;
  dailyMinutes: number;
};
type Attempt = {
  id: string;
  correct: boolean;
  createdAt: string;
  exerciseId: string;
  exercise: { lessonId: string; prompt: string; kind: string };
};
type DashboardData = {
  user: { name: string; email: string; profile: Profile };
  lessons: LessonSummary[];
  progress: { lessonId: string; completedAt: string }[];
  attempts: Attempt[];
};
type Lesson = LessonSummary & {
  content: LessonContent;
  exercises: { id: string; kind: string; prompt: string; starter?: string }[];
  solved: string[];
};
async function api(path: string, body?: unknown) {
  const response = await fetch(
    "/api/" + path,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Заявката не беше успешна.");
  return data;
}
const navigation = [
  { id: "dashboard", label: "Моят преглед", icon: LayoutDashboard },
  { id: "learn", label: "Учебна пътека", icon: BookOpen },
  { id: "practice", label: "Практика", icon: Code2 },
  { id: "lab", label: "Визуална лаборатория", icon: ChartNoAxesCombined },
  { id: "professor", label: "AI преподавател", icon: Sparkles },
  { id: "progress", label: "Моят напредък", icon: Activity },
];
const titles: Record<string, string> = {
  dashboard: "Моят преглед",
  learn: "Учебна пътека",
  practice: "Практика",
  lab: "Визуална лаборатория",
  professor: "AI преподавател",
  progress: "Моят напредък",
  settings: "Настройки",
  billing: "Абонамент",
  lessons: "Учебна пътека",
  onboarding: "Твоят учебен план",
};
export function Workspace({
  section,
  lessonId,
  name,
}: {
  section: string;
  lessonId?: string;
  name: string;
}) {
  const [data, setData] = useState<DashboardData | null>(null),
    [error, setError] = useState(""),
    [mobile, setMobile] = useState(false),
    [light, setLight] = useState(false),
    [track, setTrack] = useState("math");
  useEffect(() => {
    const preference = localStorage.getItem("mathforge-theme") !== "dark";
    setLight(preference);
    document.documentElement.dataset.theme = preference ? "light" : "dark";
    api("dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  const refresh = () =>
    api("dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  function theme() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("mathforge-theme", next ? "light" : "dark");
  }
  async function signout() {
    try {
      await api("auth/logout", {});
      window.location.href = "/login";
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link className="brand" href="/dashboard">
          <span className="brand-icon">
            <Sigma size={25} />
          </span>
          MathForge<span className="brand-ai">AI</span>
        </Link>
        <div className="workspace-label">ТВОЕТО УЧЕБНО ПРОСТРАНСТВО</div>
        <nav>
          {navigation.map((n) => (
            <Link
              onClick={() => setMobile(false)}
              className={`nav-item ${section === n.id || (section === "lessons" && n.id === "learn") ? "active" : ""}`}
              key={n.id}
              href={"/" + n.id}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "professor" && <span className="tiny-badge">AI</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="square-icon">
            <GraduationCap size={22} />
          </span>
          <h4>Как се завършва урок?</h4>
          <p>
            Прочети примера и реши трите упражнения. При затруднение използвай
            подсказка.
          </p>
          <Link href="/learn">
            Открий своя урок <ArrowRight size={14} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link
            className={`nav-item ${section === "settings" ? "active" : ""}`}
            href="/settings"
          >
            <Settings size={18} />
            Настройки
          </Link>
          <button
            className="profile-row"
            onClick={signout}
            title="Изход от профила"
            aria-label="Изход от профила"
          >
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            <span>
              <b>{name}</b>
              <small>Безплатен учебен профил</small>
            </span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="Затвори менюто"
          className="mobile-backdrop"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Отвори менюто"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">Моето пространство</span>
            <ChevronRight size={14} />
            <strong>{titles[section]}</strong>
          </div>
          <div>
            <span className="top-status">
              <span /> Учим със собствено темпо
            </span>
            <button
              className="icon-button"
              aria-label="Смени темата"
              onClick={theme}
            >
              {light ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <span className="avatar small">
              {name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="main-content">
          {error && (
            <div role="alert" className="error">
              {error}
              <Button variant="ghost" onClick={refresh}>
                Опитай отново
              </Button>
            </div>
          )}
          {!data && !error ? (
            <div className="loading">
              <span className="loader" />
              Подготвяме твоето учебно пространство…
            </div>
          ) : (
            data && (
              <>
                {section === "onboarding" ? (
                  <Onboarding profile={data.user.profile} />
                ) : section === "dashboard" ? (
                  <Dashboard data={data} track={track} setTrack={setTrack} />
                ) : section === "learn" || section === "practice" ? (
                  <Catalog
                    data={data}
                    track={track}
                    setTrack={setTrack}
                    practice={section === "practice"}
                  />
                ) : section === "lessons" && lessonId ? (
                  <LessonView id={lessonId} onComplete={refresh} />
                ) : section === "lab" ? (
                  <>
                    <PageTitle
                      eyebrow="ОТ ФОРМУЛАТА ДО ГРАФИКАТА"
                      title="Математиката в движение"
                      subtitle="Промени параметрите. Наблюдавай. Разбери защо."
                    />
                    <Graph />
                    <div className="panel">
                      <h3>Същата идея на Wolfram Language</h3>
                      <pre>
                        Manipulate[Plot[a*Exp[k*x], {"{"}x,0,8{"}"}], {"{"}a,1,5
                        {"}"}, {"{"}k,-1,1{"}"}]
                      </pre>
                      <p className="muted">
                        Това е учебен код за Mathematica. Графиката по-горе се
                        изчислява независимо от него.
                      </p>
                    </div>
                  </>
                ) : section === "progress" ? (
                  <Progress data={data} />
                ) : section === "settings" ? (
                  <>
                    <PageTitle
                      eyebrow="ТВОЯТ ПРОФИЛ"
                      title="Настройки"
                      subtitle={data.user.email}
                    />
                    <Onboarding profile={data.user.profile} editing />
                  </>
                ) : section === "professor" ? (
                  <Unavailable kind="professor" />
                ) : section === "billing" ? (
                  <Unavailable kind="billing" />
                ) : null}
              </>
            )
          )}
        </main>
        <footer className="footer">
          <span>
            MathForge AI <span>·</span> Изгради разбиране, стъпка по стъпка.
          </span>
          <span>
            Учебна версия 0.1 <span>·</span> Създадено за любопитни умове
          </span>
        </footer>
      </div>
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
function TrackSwitch({
  track,
  setTrack,
}: {
  track: string;
  setTrack: (t: string) => void;
}) {
  return (
    <div
      className="track-switch"
      role="group"
      aria-label="Избери учебна пътека"
    >
      <button
        className={track === "math" ? "selected" : ""}
        onClick={() => setTrack("math")}
      >
        <Sigma size={17} />
        Математика
      </button>
      <button
        className={track === "wolfram" ? "selected" : ""}
        onClick={() => setTrack("wolfram")}
      >
        <Braces size={17} />
        Wolfram Mathematica
      </button>
      <button
        className={track === "combined" ? "selected" : ""}
        onClick={() => setTrack("combined")}
      >
        <CheckCheck size={17} />
        Двата подхода
      </button>
    </div>
  );
}
function recommendation(data: DashboardData, track: string) {
  const completed = new Set(data.progress.map((p) => p.lessonId));
  const profile = data.user.profile;
  const failures = data.attempts.filter((a) => !a.correct);
  const weak = failures.find(
    (a) =>
      !data.attempts.some(
        (b) =>
          b.exerciseId === a.exerciseId &&
          b.correct &&
          new Date(b.createdAt) > new Date(a.createdAt),
      ),
  );
  if (weak) {
    const lesson = data.lessons.find(
      (l) => l.id === weak.exercise.lessonId && l.track === track,
    );
    if (lesson) return lesson;
  }
  const start =
    track === "math" && profile?.level === "advanced" && profile.integrals
      ? "separable"
      : track === "math" && profile?.level === "intermediate"
        ? "derivatives"
        : null;
  const list = data.lessons.filter((l) => l.track === track);
  const index = start ? list.findIndex((l) => l.id === start) : 0;
  return (
    list.slice(Math.max(index, 0)).find((l) => !completed.has(l.id)) ||
    list.find((l) => !completed.has(l.id)) ||
    list[0]
  );
}
function mastery(data: DashboardData, track: string) {
  const exercises = new Set(
    data.attempts
      .filter(
        (a) =>
          a.correct &&
          data.lessons.some(
            (l) => l.id === a.exercise.lessonId && l.track === track,
          ),
      )
      .map((a) => a.exerciseId),
  );
  const total = data.lessons
    .filter((l) => l.track === track)
    .reduce((n, l) => n + l._count.exercises, 0);
  return total ? Math.round((exercises.size / total) * 100) : 0;
}
function streak(data: DashboardData) {
  const dates = new Set(
    data.attempts.map((a) =>
      new Date(a.createdAt).toLocaleDateString("en-CA", {
        timeZone: "Europe/Sofia",
      }),
    ),
  );
  let count = 0;
  const day = new Date();
  if (!dates.has(day.toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" })))
    day.setDate(day.getDate() - 1);
  while (
    dates.has(day.toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" }))
  ) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}
function Dashboard({
  data,
  track,
  setTrack,
}: {
  data: DashboardData;
  track: string;
  setTrack: (v: string) => void;
}) {
  const next = recommendation(data, track),
    solved = new Set(
      data.attempts.filter((a) => a.correct).map((a) => a.exerciseId),
    ).size;
  const completed = new Set(data.progress.map((p) => p.lessonId));
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Sofia",
  });
  const todaySolved = new Set(
    data.attempts
      .filter(
        (a) =>
          a.correct &&
          new Date(a.createdAt).toLocaleDateString("en-CA", {
            timeZone: "Europe/Sofia",
          }) === today,
      )
      .map((a) => a.exerciseId),
  ).size;
  return (
    <>
      <PageTitle
        eyebrow="МОЯТА УЧЕБНА ТЕТРАДКА"
        title={`Здравей, ${data.user.name.split(" ")[0]}`}
        subtitle="Избери урок, проследи примера и провери какво си разбрал."
      >
        <span className="date-label">
          {new Intl.DateTimeFormat("bg-BG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Sofia",
          }).format(new Date())}
        </span>
      </PageTitle>
      <div className="stats-grid">
        <Stat
          icon={Flame}
          value={streak(data)}
          label="дни последователно"
          color="orange"
          detail="Дни с упражнение"
        />
        <Stat
          icon={BookOpen}
          value={`${data.progress.length} / ${data.lessons.length}`}
          label="завършени урока"
          color="violet"
          detail="С всички решени упражнения"
        />
        <Stat
          icon={CheckCheck}
          value={solved}
          label="решени задачи"
          color="green"
          detail="Проверени отговори"
        />
        <Stat
          icon={Target}
          value={`${todaySolved} / 3`}
          label="задачи за днес"
          color="blue"
          detail="Цел: 3 верни отговора"
        />
      </div>
      <div className="dashboard-grid">
        <div className="main-column">
          <div className="section-row">
            <h2>Следващият ти урок</h2>
            <Link href="/learn">
              Всички уроци <ArrowRight size={15} />
            </Link>
          </div>
          <TrackSwitch track={track} setTrack={setTrack} />
          {next && (
            <div className="continue-card">
              <div className="continue-copy">
                <span className="tag">
                  <span className="status-dot" /> ПРЕПОРЪЧАН УРОК
                </span>
                <p className="recommendation-reason">
                  Подбор според подготовката ти, завършените уроци и последните
                  нерешени задачи.
                </p>
                <div className="lesson-meta">
                  {next.module}
                  <span>·</span>Урок{" "}
                  {data.lessons
                    .filter((l) => l.track === track)
                    .findIndex((l) => l.id === next.id) + 1}
                </div>
                <h2>{next.title}</h2>
                <p>{next.description}</p>
                <div className="inline-meta">
                  <span>
                    <Clock size={14} />
                    {next.minutes} мин
                  </span>
                  <span>
                    <Code2 size={14} />
                    {next._count.exercises} упражнения
                  </span>
                </div>
                <Button asChild>
                  <Link href={"/lessons/" + next.id}>
                    Започни урока <ArrowRight size={17} />
                  </Link>
                </Button>
              </div>
              <div className="math-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="art-label">РАЗБЕРИ. ПРИЛОЖИ. УСПЕЙ.</span>
                <span className="art-equation">
                  {track === "wolfram" ? "f[x_] := x²" : "y′ = ky"}
                </span>
                <svg viewBox="0 0 260 130">
                  <defs>
                    <linearGradient id="curve" x1="0" x2="1">
                      <stop stopColor="#7067ff" />
                      <stop offset="1" stopColor="#c8b9ff" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M10 115H250 M35 125V5"
                    stroke="#736d9d"
                    strokeOpacity=".3"
                  />
                  <path
                    d="M35 110 C110 110 140 85 170 65 S210 25 240 10"
                    stroke="url(#curve)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle cx="170" cy="65" r="5" fill="#c6baff" />
                </svg>
                <span className="art-caption">Разбирането променя всичко.</span>
              </div>
            </div>
          )}
          <div className="section-row section-spacing">
            <h2>Твоите учебни пътеки</h2>
            <span className="muted">Математика и работа с код</span>
          </div>
          <div className="track-cards">
            {[
              {
                id: "math",
                icon: Sigma,
                title: "Математика",
                desc: "От основите до диференциалните уравнения",
                label: "12 урока · 6 теми",
              },
              {
                id: "wolfram",
                icon: Braces,
                title: "Wolfram Mathematica",
                desc: "Превърни математиката в работещ код",
                label: "9 урока · 3 теми",
              },
            ].map((t) => (
              <Link
                className={`panel track-card ${t.id}`}
                key={t.id}
                href="/learn"
                onClick={() => {
                  sessionStorage.setItem("mathforge-track", t.id);
                }}
              >
                <div className="track-card-top">
                  <span className="square-icon">
                    <t.icon size={23} />
                  </span>
                  <ArrowRight size={18} />
                </div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <div className="progress-caption">
                  <span>{t.label}</span>
                  <b>{mastery(data, t.id)}%</b>
                </div>
                <div className="progress-bar">
                  <span style={{ width: mastery(data, t.id) + "%" }} />
                </div>
              </Link>
            ))}
          </div>
          <div className="section-row section-spacing">
            <h2>Последни упражнения</h2>
            <Link href="/progress">
              Виж напредъка <ArrowRight size={15} />
            </Link>
          </div>
          <div className="panel activity-panel">
            {data.attempts.length ? (
              data.attempts.slice(0, 3).map((a) => (
                <div className="activity-row" key={a.id}>
                  <span
                    className={`activity-dot ${a.correct ? "success" : "retry"}`}
                  >
                    {a.correct ? <Check size={16} /> : <RotateCcw size={15} />}
                  </span>
                  <div>
                    <b>
                      {a.correct
                        ? "Успешно решена задача"
                        : "Възможност за нов опит"}
                    </b>
                    <p>{a.exercise.prompt}</p>
                  </div>
                  <Link href={"/lessons/" + a.exercise.lessonId}>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="empty-inline">
                <span className="square-icon">
                  <BookOpen />
                </span>
                <div>
                  <b>Още няма решени задачи</b>
                  <p>Реши първата си задача и виж напредъка си.</p>
                </div>
                <Link href={"/lessons/" + next?.id}>
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
        <aside className="right-column">
          <div className="panel daily-panel">
            <div className="panel-heading">
              <h3>Днешният фокус</h3>
              <Target size={18} />
            </div>
            <div
              className="daily-ring"
              style={{
                background: `conic-gradient(var(--accent) ${Math.min(todaySolved / 3, 1) * 360}deg, var(--border) 0deg)`,
              }}
            >
              <div>
                <strong>
                  {Math.round(Math.min(todaySolved / 3, 1) * 100)}
                  <small>%</small>
                </strong>
                <span>от дневната цел</span>
              </div>
            </div>
            <h4>
              {todaySolved >= 3
                ? "Страхотна работа днес!"
                : "Малко практика, голяма промяна"}
            </h4>
            <p>Реши 3 задачи днес и затвърди наученото.</p>
            <div className="daily-check">
              <span className={todaySolved >= 1 ? "checked" : ""}>
                {todaySolved >= 1 ? <Check size={13} /> : null}
              </span>
              Първа решена задача
            </div>
            <div className="daily-check">
              <span className={todaySolved >= 3 ? "checked" : ""}>
                {todaySolved >= 3 ? <Check size={13} /> : null}
              </span>
              Три верни отговора
            </div>
          </div>
          <div className="panel tip-panel">
            <span className="eyebrow">
              <Lightbulb size={15} /> УЧИ С РАЗБИРАНЕ
            </span>
            <h3>Не бързай към отговора.</h3>
            <p>
              Опитай самостоятелно. Подсказките са тук, когато имаш нужда — една
              стъпка наведнъж.
            </p>
            <Link href="/practice">
              Време за практика <ArrowRight size={15} />
            </Link>
          </div>
          <div className="panel course-panel">
            <div className="tiny-icon">
              <GraduationCap size={19} />
            </div>
            <span className="eyebrow">ТВОЯТ УНИВЕРСИТЕТСКИ ФОКУС</span>
            <h3>{data.user.profile?.subject || "Модели на реални процеси"}</h3>
            <p>
              {data.user.profile?.examDate
                ? `Изпит: ${data.user.profile.examDate}`
                : "Добави дата на изпита, за да планираш подготовката."}
            </p>
            <Link href="/settings">
              Настрой учебния си план <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
function Stat({
  icon: Icon,
  value,
  label,
  color,
  detail,
}: {
  icon: typeof Flame;
  value: string | number;
  label: string;
  color: string;
  detail: string;
}) {
  return (
    <div className="panel stat">
      <span className={`stat-icon ${color}`}>
        <Icon size={20} />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        <small>{detail}</small>
      </div>
    </div>
  );
}
function Catalog({
  data,
  track,
  setTrack,
  practice,
}: {
  data: DashboardData;
  track: string;
  setTrack: (v: string) => void;
  practice: boolean;
}) {
  useEffect(() => {
    const saved = sessionStorage.getItem("mathforge-track");
    if (saved) {
      setTrack(saved);
      sessionStorage.removeItem("mathforge-track");
    }
  }, [setTrack]);
  const list = data.lessons.filter((l) => l.track === track);
  const modules = Array.from(new Set(list.map((l) => l.module)));
  const completed = new Set(data.progress.map((p) => p.lessonId));
  return (
    <>
      <PageTitle
        eyebrow={practice ? "УЧИ ЧРЕЗ ДЕЙСТВИЕ" : "ЗНАНИЯ, КОИТО СЕ НАДГРАЖДАТ"}
        title={
          practice
            ? "Твоето място за практика"
            : "Стъпка по стъпка към увереност"
        }
        subtitle={
          practice
            ? "Избери урок и приложи наученото с три проверени задачи."
            : "Започни от основите или се върни към тема, която искаш да затвърдиш."
        }
      />
      <TrackSwitch track={track} setTrack={setTrack} />
      {modules.map((module, i) => (
        <section className="curriculum-module" key={module}>
          <div className="section-row">
            <h2>
              <span className="module-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              {module}
            </h2>
            <span className="muted">
              {
                list.filter((l) => l.module === module && completed.has(l.id))
                  .length
              }{" "}
              / {list.filter((l) => l.module === module).length} завършени
            </span>
          </div>
          <div className="lesson-list">
            {list
              .filter((l) => l.module === module)
              .map((l, index) => (
                <Link
                  href={"/lessons/" + l.id}
                  key={l.id}
                  className="panel lesson-card"
                >
                  <span
                    className={`lesson-number ${completed.has(l.id) ? "done" : ""}`}
                  >
                    {completed.has(l.id) ? (
                      <Check size={19} />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <div>
                    <h3>{l.title}</h3>
                    <p>{l.description}</p>
                    <span className="inline-meta">
                      <span>
                        <Clock size={13} />
                        {l.minutes} мин
                      </span>
                      <span>{l._count.exercises} задачи</span>
                      {l.prerequisiteId && !completed.has(l.prerequisiteId) && (
                        <span>Препоръчително: предишният урок</span>
                      )}
                    </span>
                  </div>
                  <ArrowRight size={19} />
                </Link>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
function Onboarding({
  profile,
  editing = false,
}: {
  profile: Profile | null;
  editing?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await api("profile", {
        level: f.get("level"),
        derivatives: f.get("derivatives") === "on",
        integrals: f.get("integrals") === "on",
        equations: f.get("equations") === "on",
        wolfram: f.get("wolfram") === "on",
        subject: f.get("subject"),
        examDate: f.get("examDate"),
        grade: Number(f.get("grade")),
        dailyMinutes: Number(f.get("dailyMinutes")),
      });
      if (editing) {
        setSaved(true);
        setBusy(false);
      } else window.location.href = "/dashboard";
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="onboarding">
      {!editing && (
        <PageTitle
          eyebrow="ДА ЗАПОЧНЕМ ОТ ТЕБ"
          title="Твоят път е личен"
          subtitle="Няма грешно начално ниво. Ще подберем подходяща следваща стъпка."
        />
      )}
      <form className="panel onboarding-form" onSubmit={submit}>
        <h3>
          <GraduationCap size={20} />
          Няколко думи за теб
        </h3>
        <label>
          Как оценяваш математическата си подготовка?
          <select name="level" defaultValue={profile?.level || "beginner"}>
            <option value="beginner">Започвам от основите</option>
            <option value="intermediate">Знам алгебра, уча анализ</option>
            <option value="advanced">
              Готов съм за диференциални уравнения
            </option>
          </select>
        </label>
        <fieldset>
          <legend>Кои теми си изучавал?</legend>
          {[
            { id: "derivatives", label: "Производни" },
            { id: "integrals", label: "Интеграли" },
            { id: "equations", label: "Диференциални уравнения" },
            { id: "wolfram", label: "Работил съм с Wolfram Mathematica" },
          ].map((c) => (
            <label className="checkbox-label" key={c.id}>
              <input
                type="checkbox"
                name={c.id}
                defaultChecked={Boolean(profile?.[c.id as keyof Profile])}
              />
              {c.label}
            </label>
          ))}
        </fieldset>
        <label>
          Университетски предмет
          <input
            name="subject"
            defaultValue={profile?.subject || "Модели на реални процеси"}
            required
            maxLength={120}
          />
        </label>
        <div className="form-grid">
          <label>
            Дата на изпита (по желание)
            <input
              type="date"
              name="examDate"
              defaultValue={profile?.examDate || ""}
            />
          </label>
          <label>
            Желана оценка
            <select name="grade" defaultValue={profile?.grade || 5}>
              <option value={3}>Среден 3</option>
              <option value={4}>Добър 4</option>
              <option value={5}>Много добър 5</option>
              <option value={6}>Отличен 6</option>
            </select>
          </label>
        </div>
        <label>
          Минути за учене на ден
          <select
            name="dailyMinutes"
            defaultValue={profile?.dailyMinutes || 20}
          >
            {[10, 20, 30, 45, 60, 90, 120, 180].map((n) => (
              <option key={n} value={n}>
                {n} минути
              </option>
            ))}
          </select>
        </label>
        <p className="muted">
          За начинаещи препоръчваме „Дроби и ред на действията“. Ако знаеш
          алгебра — „Производната като скорост“. Ако владееш интеграли —
          „Уравнения с разделящи се променливи“. Всички уроци остават достъпни.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="success-message">
            Учебният план е запазен.
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy
            ? "Запазване…"
            : editing
              ? "Запази промените"
              : "Към моето учебно пространство"}
          <ArrowRight size={17} />
        </Button>
      </form>
    </div>
  );
}
function LessonView({
  id,
  onComplete,
}: {
  id: string;
  onComplete: () => void;
}) {
  const [lesson, setLesson] = useState<Lesson | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState("theory");
  useEffect(() => {
    let alive = true;
    api("lessons/" + id)
      .then((l) => {
        if (alive) setLesson(l);
      })
      .catch((e) => setError(e.message));
    let sessionId: string | undefined;
    api("study", { action: "start" }).then((r) => {
      sessionId = r.id;
    });
    return () => {
      alive = false;
      if (sessionId)
        void api("study", { action: "end", id: sessionId }).catch(() => {});
    };
  }, [id]);
  if (error)
    return (
      <p role="alert" className="error">
        {error}
      </p>
    );
  if (!lesson) return <p>Зареждане на урока…</p>;
  const done = lesson.solved.length === lesson.exercises.length;
  return (
    <>
      <Link className="back-link" href="/learn">
        <ArrowLeft size={15} />
        Към учебната пътека
      </Link>
      <PageTitle
        eyebrow={lesson.module.toUpperCase()}
        title={lesson.title}
        subtitle={lesson.description}
      >
        <span className="tag">
          <Clock size={14} />
          {lesson.minutes} мин
        </span>
      </PageTitle>
      <div className="lesson-tabs">
        <button
          className={tab === "theory" ? "selected" : ""}
          onClick={() => setTab("theory")}
        >
          <BookOpen size={16} />
          Разбери теорията
        </button>
        <button
          className={tab === "practice" ? "selected" : ""}
          onClick={() => setTab("practice")}
        >
          <Code2 size={16} />
          Опитай самостоятелно
          <span className="tiny-badge">
            {lesson.solved.length}/{lesson.exercises.length}
          </span>
        </button>
      </div>
      {done && (
        <div role="status" className="completion">
          <Trophy />
          <div>
            <strong>Урокът е завършен!</strong>
            <p>Всички задачи са решени вярно. Напредъкът ти е запазен.</p>
          </div>
          <Link href="/learn">
            Следваща стъпка <ArrowRight size={16} />
          </Link>
        </div>
      )}
      {tab === "theory" ? (
        <div className="lesson-body">
          <article className="panel theory">
            <span className="eyebrow">СЛЕД ТОЗИ УРОК ЩЕ МОЖЕШ</span>
            <ul className="objectives">
              {lesson.content.objectives.map((o) => (
                <li key={o}>
                  <Check size={16} />
                  {o}
                </li>
              ))}
            </ul>
            <h2>Да започнем с идеята</h2>
            {lesson.content.theory.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <Formula tex={lesson.content.formula} />
            <h2>Заедно, стъпка по стъпка</h2>
            <ol className="worked-steps">
              {lesson.content.steps.map((s, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
            {lesson.content.comparison && (
              <div className="comparison">
                {lesson.content.comparison.map((c, i) => (
                  <div key={i}>
                    <h3>{i === 0 ? "Реши ръчно" : "Реши с Mathematica"}</h3>
                    <p>{c}</p>
                  </div>
                ))}
              </div>
            )}
            {lesson.content.wolfram && (
              <>
                <h3>Същата идея на Wolfram Language</h3>
                <pre>{lesson.content.wolfram}</pre>
                <p className="muted">
                  Учебен образец. Кодът не е изпълнен в Wolfram ядро.
                </p>
              </>
            )}
            <div className="mistakes">
              <Lightbulb size={20} />
              <div>
                <h3>Честа грешка</h3>
                {lesson.content.mistakes.map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </div>
            </div>
            <Button onClick={() => setTab("practice")}>
              Готов съм да опитам <ArrowRight size={17} />
            </Button>
          </article>
          <aside className="panel lesson-outline">
            <span className="square-icon">
              <Target />
            </span>
            <h3>Една идея. Три опита.</h3>
            <p>
              Прочети примера, след това скрий теорията и опитай самостоятелно.
            </p>
            <div className="outline-step">
              <Check size={15} />
              Разбери основната идея
            </div>
            <div className="outline-step">
              <Check size={15} />
              Проследи решението
            </div>
            <div className="outline-step">
              <Play size={15} />
              Приложи наученото
            </div>
            <Button variant="outline" onClick={() => setTab("practice")}>
              Към упражненията
            </Button>
          </aside>
        </div>
      ) : (
        <div className="exercise-list">
          {lesson.exercises.map((exercise, index) => (
            <Exercise
              key={exercise.id}
              exercise={exercise}
              index={index}
              solved={lesson.solved.includes(exercise.id)}
              onSolved={() => {
                setLesson((old) =>
                  old
                    ? {
                        ...old,
                        solved: Array.from(
                          new Set([...old.solved, exercise.id]),
                        ),
                      }
                    : old,
                );
                onComplete();
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
function Exercise({
  exercise,
  index,
  solved,
  onSolved,
}: {
  exercise: Lesson["exercises"][number];
  index: number;
  solved: boolean;
  onSolved: () => void;
}) {
  const [answer, setAnswer] = useState(exercise.starter || ""),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      message: string;
      explanation?: string;
    } | null>(null),
    [error, setError] = useState(""),
    [hints, setHints] = useState<string[]>([]),
    [solution, setSolution] = useState<{
      answer: string;
      explanation: string;
    } | null>(null);
  async function check(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api(`exercises/${exercise.id}/check`, { answer });
      setFeedback(result);
      if (result.correct) onSolved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function hint() {
    try {
      const result = await api(`exercises/${exercise.id}/hint`, {
        level: hints.length,
      });
      setHints((old) => [...old, result.hint]);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function reveal() {
    try {
      setSolution(await api(`exercises/${exercise.id}/solution`, {}));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className={`panel exercise ${solved ? "solved" : ""}`}>
      <div className="panel-heading">
        <span className="eyebrow">
          ЗАДАЧА {index + 1} <span>·</span>{" "}
          {exercise.kind === "wolfram"
            ? "WOLFRAM ПРАКТИКА"
            : "СИМВОЛЕН ОТГОВОР"}
        </span>
        {solved && (
          <span className="tag green">
            <Check size={14} />
            Решена
          </span>
        )}
      </div>
      <h3>{exercise.prompt}</h3>
      {exercise.kind === "wolfram" ? (
        <p className="practice-notice">
          <Braces size={16} />
          Учебен режим: проверява се записът спрямо конкретен образец. Няма
          изпълнение на код.
        </p>
      ) : (
        <p className="muted">
          Използвай * за умножение, ^ за степен, exp(x), sin(x), cos(x), log(x),
          sqrt(x). Променливите са реални.
        </p>
      )}
      <form onSubmit={check}>
        {exercise.kind === "wolfram" ? (
          <CodeEditor value={answer} onChange={setAnswer} />
        ) : (
          <label>
            Твоят отговор
            <input
              aria-label={"Отговор на задача " + (index + 1)}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              maxLength={256}
              autoComplete="off"
              placeholder="Например: 3*exp(2*x)"
            />
          </label>
        )}
        <div className="exercise-actions">
          <Button type="submit" disabled={busy || !answer.trim()}>
            {busy ? "Проверка…" : "Провери отговора"}
            <Check size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={hint}
            disabled={hints.length >= 3}
          >
            <Lightbulb size={16} />
            Подсказка ({hints.length}/3)
          </Button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setAnswer(exercise.starter || "");
              setFeedback(null);
              setError("");
            }}
          >
            <RotateCcw size={15} />
            Нулирай
          </button>
        </div>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <div
          role="status"
          className={
            feedback.correct ? "feedback correct" : "feedback incorrect"
          }
        >
          <strong>{feedback.message}</strong>
          {feedback.explanation && <p>{feedback.explanation}</p>}
        </div>
      )}
      {hints.map((h, i) => (
        <div className="hint" key={i}>
          <Lightbulb size={15} />
          <span>
            <b>Подсказка {i + 1}.</b> {h}
          </span>
        </div>
      ))}
      {solution ? (
        <div className="revealed">
          <b>Проверено решение</b>
          <pre>{solution.answer}</pre>
          <p>{solution.explanation}</p>
          <small>
            Прочитаното решение не завършва задачата. Въведи отговор, за да бъде
            проверен.
          </small>
        </div>
      ) : (
        <button className="text-button reveal-button" onClick={reveal}>
          Искам да видя решението <ArrowDown size={13} />
        </button>
      )}
    </section>
  );
}
function Progress({ data }: { data: DashboardData }) {
  const correct = new Set(
    data.attempts.filter((a) => a.correct).map((a) => a.exerciseId),
  ).size;
  const unresolved = data.attempts.filter(
    (a) =>
      !a.correct &&
      !data.attempts.some(
        (b) =>
          b.correct &&
          b.exerciseId === a.exerciseId &&
          new Date(b.createdAt) > new Date(a.createdAt),
      ),
  );
  const weak = Array.from(new Set(unresolved.map((a) => a.exercise.lessonId)));
  return (
    <>
      <PageTitle
        eyebrow="ВСЕКИ ОПИТ ТЕ ДВИЖИ НАПРЕД"
        title="Твоят напредък е реален"
        subtitle="Тук виждаш единствено резултати от собствената си практика."
      />
      <div className="stats-grid">
        <Stat
          icon={BookOpen}
          value={data.progress.length}
          label="завършени урока"
          color="violet"
          detail="С три верни отговора"
        />
        <Stat
          icon={CheckCheck}
          value={correct}
          label="решени задачи"
          color="green"
          detail="Без повторно броене"
        />
        <Stat
          icon={RotateCcw}
          value={data.attempts.filter((a) => !a.correct).length}
          label="опити за подобрение"
          color="orange"
          detail="Всеки опит е полезен"
        />
        <Stat
          icon={Flame}
          value={streak(data)}
          label="дни последователно"
          color="blue"
          detail="Часова зона: София"
        />
      </div>
      <div className="two-columns">
        {["math", "wolfram", "combined"].map((t) => (
          <div className="panel" key={t}>
            <h3>
              {t === "math"
                ? "Математика"
                : t === "wolfram"
                  ? "Wolfram Mathematica"
                  : "Двата подхода"}
            </h3>
            <strong className="big-number">{mastery(data, t)}%</strong>
            <p className="muted">
              Дял успешно решени задачи от наличната учебна банка.
            </p>
            <div className="progress-bar">
              <span style={{ width: mastery(data, t) + "%" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="section-row section-spacing">
        <h2>Препоръчително повторение</h2>
      </div>
      <div className="panel">
        {weak.length ? (
          weak.map((id) => {
            const lesson = data.lessons.find((l) => l.id === id);
            return (
              <Link className="review-link" href={"/lessons/" + id} key={id}>
                <RotateCcw size={16} />
                {lesson?.title}
                <ArrowRight size={16} />
              </Link>
            );
          })
        ) : (
          <p className="muted">
            Няма нерешени грешки за повторение. Продължи с нов урок.
          </p>
        )}
      </div>
      <div className="section-row section-spacing">
        <h2>История на опитите</h2>
        <small className="muted">
          Последни 30 опита · статистика за цялата история
        </small>
      </div>
      <div className="panel activity-panel">
        {data.attempts.length ? (
          data.attempts.slice(0, 30).map((a) => (
            <div className="activity-row" key={a.id}>
              <span
                className={"activity-dot " + (a.correct ? "success" : "retry")}
              >
                {a.correct ? <Check size={16} /> : <RotateCcw size={16} />}
              </span>
              <div>
                <b>{a.exercise.prompt}</b>
                <p>
                  {new Date(a.createdAt).toLocaleString("bg-BG", {
                    timeZone: "Europe/Sofia",
                  })}{" "}
                  · {a.correct ? "Верен отговор" : "Опитай отново"}
                </p>
              </div>
              <Link href={"/lessons/" + a.exercise.lessonId}>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))
        ) : (
          <p className="muted">Още няма опити. Започни първия си урок.</p>
        )}
      </div>
    </>
  );
}
function Unavailable({ kind }: { kind: string }) {
  return (
    <>
      <PageTitle
        eyebrow="СЛЕДВАЩ ЕТАП"
        title={
          kind === "professor"
            ? "Твоят AI преподавател"
            : "Ученето започва безплатно"
        }
        subtitle={
          kind === "professor"
            ? "Първо разбиране. После персонална AI подкрепа."
            : "Основният учебен път работи без платежни услуги."
        }
      />
      <div className="panel unavailable">
        <span className="square-icon">
          {kind === "professor" ? <Sparkles /> : <GraduationCap />}
        </span>
        <h2>
          {kind === "professor"
            ? "AI услугата още не е свързана"
            : "Плащанията още не са активни"}
        </h2>
        <p>
          {kind === "professor"
            ? "В тази версия няма AI чат и не се изпращат данни към AI доставчици. Всеки урок включва три нива на проверени подсказки и подробно решение."
            : "Текущата версия е безплатна. Student Pro (€9,99/месец) е планиран продукт, а не действащ абонамент. Не се събират плащания."}
        </p>
        <Button asChild>
          <Link href="/learn">
            Разгледай уроците <ArrowRight size={17} />
          </Link>
        </Button>
      </div>
    </>
  );
}

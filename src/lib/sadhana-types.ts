// Core data model and auto-computed scoring for the Sadhana tracker.
// Scores follow the ISKCON Sydney Brahmacari Sadhana Card marking scheme.

export interface DailyEntry {
  date: string; // yyyy-MM-dd
  dayOfWeek: string; // SUN..SAT
  bedTime: string | null; // HH:mm, recorded against the current day
  bedTimeScore: number;
  wakeUpTime: string | null;
  wakeUpScore: number;
  japaCompletionTime: string | null;
  japaScore: number;
  japaRounds: number;
  mangalaArati: boolean;
  tulasiArati: boolean;
  darshanArati: boolean;
  guruPuja: boolean;
  bhagavatamClass: boolean;
  deityDarshan: boolean;
  slokaMemorisation: boolean;
  yoga: boolean;
  bookDistribution: boolean;
  bdHours: number;
  instrumentPractice: boolean;
  gauraArati: boolean;
  spBooksMinutes: number;
  spLecturesMinutes: number;
  guruMaharajaMinutes: number;
  rspLecturesMinutes: number;
}

export const DAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const ATTENDANCE_ITEMS: { key: keyof DailyEntry; label: string }[] = [
  { key: "mangalaArati", label: "Mangala Arati" },
  { key: "tulasiArati", label: "Tulasi Arati" },
  { key: "darshanArati", label: "Darshan Arati" },
  { key: "guruPuja", label: "Guru Puja" },
  { key: "bhagavatamClass", label: "Bhagavatam Class" },
  { key: "deityDarshan", label: "Deity Darshan (10 min)" },
  { key: "slokaMemorisation", label: "Sloka Memorisation (10 min)" },
  { key: "yoga", label: "Yoga (30 min)" },
  { key: "bookDistribution", label: "Book Distribution" },
  { key: "instrumentPractice", label: "Instrument Practice (20 min)" },
  { key: "gauraArati", label: "Gaura Arati" },
];

export const STUDY_ITEMS: { key: keyof DailyEntry; label: string }[] = [
  { key: "spBooksMinutes", label: "Srila Prabhupada Books" },
  { key: "spLecturesMinutes", label: "Srila Prabhupada Lectures" },
  { key: "guruMaharajaMinutes", label: "Guru Maharaj's Lectures" },
  { key: "rspLecturesMinutes", label: "RSP Lectures" },
];

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Generic step function: thresholds are [minutesOfDay, score] pairs, ascending. */
const stepScore = (time: string | null, steps: [number, number][]): number => {
  if (!time) return 0;
  const t = toMinutes(time);
  for (const [limit, score] of steps) if (t <= limit) return score;
  return -5;
};

const T = (h: number, m: number) => h * 60 + m;

/** Bed time, ideal 20:45. Times after midnight up to 04:00 count as "late". */
export function scoreBedTime(time: string | null): number {
  if (!time) return 0;
  let t = toMinutes(time);
  if (t < T(12, 0)) t += 24 * 60; // past-midnight bed times are later than any evening time
  for (const [limit, score] of [
    [T(20, 45), 25], [T(21, 0), 20], [T(21, 15), 15],
    [T(21, 30), 10], [T(21, 45), 5], [T(22, 0), 0],
  ] as [number, number][]) {
    if (t <= limit) return score;
  }
  return -5;
}

/** Wake up, ideal 03:45. */
export function scoreWakeUp(time: string | null): number {
  return stepScore(time, [
    [T(3, 45), 25], [T(4, 0), 20], [T(4, 15), 15],
    [T(4, 30), 10], [T(4, 45), 5], [T(5, 0), 0],
  ]);
}

/** Japa completion, ideal 07:15. */
export function scoreJapa(time: string | null): number {
  return stepScore(time, [
    [T(7, 15), 25], [T(9, 0), 20], [T(9, 15), 15],
    [T(9, 30), 10], [T(9, 45), 5], [T(10, 0), 0],
  ]);
}

export function emptyEntry(date: string, dayOfWeek: string): DailyEntry {
  return {
    date,
    dayOfWeek,
    bedTime: null,
    bedTimeScore: 0,
    wakeUpTime: null,
    wakeUpScore: 0,
    japaCompletionTime: null,
    japaScore: 0,
    japaRounds: 16,
    mangalaArati: false,
    tulasiArati: false,
    darshanArati: false,
    guruPuja: false,
    bhagavatamClass: false,
    deityDarshan: false,
    slokaMemorisation: false,
    yoga: false,
    bookDistribution: false,
    bdHours: 0,
    instrumentPractice: false,
    gauraArati: false,
    spBooksMinutes: 0,
    spLecturesMinutes: 0,
    guruMaharajaMinutes: 0,
    rspLecturesMinutes: 0,
  };
}

export interface WeekSummary {
  wakeTotal: number;
  japaTotal: number;
  bedTotal: number;
  readingMinutes: number;
  spLectureMinutes: number;
  gmLectureMinutes: number;
  rspLectureMinutes: number;
  morningProgramDays: number; // days with mangala arati
  daysLogged: number;
  avgReadingPerDay: number;
}

export function summariseWeek(entries: DailyEntry[]): WeekSummary {
  const sum = (f: (e: DailyEntry) => number) => entries.reduce((a, e) => a + f(e), 0);
  const daysLogged = entries.length;
  const readingMinutes = sum((e) => e.spBooksMinutes);
  return {
    wakeTotal: sum((e) => e.wakeUpScore),
    japaTotal: sum((e) => e.japaScore),
    bedTotal: sum((e) => e.bedTimeScore),
    readingMinutes,
    spLectureMinutes: sum((e) => e.spLecturesMinutes),
    gmLectureMinutes: sum((e) => e.guruMaharajaMinutes),
    rspLectureMinutes: sum((e) => e.rspLecturesMinutes),
    morningProgramDays: entries.filter((e) => e.mangalaArati).length,
    daysLogged,
    avgReadingPerDay: daysLogged ? readingMinutes / daysLogged : 0,
  };
}

export interface WeekComparison {
  thisWeek: WeekSummary;
  lastWeek: WeekSummary;
  improving: boolean;
  lowReading: boolean;
  lowHearing: boolean;
  missedMorningProgram: boolean;
  irregularSleep: boolean;
}

export function compareWeeks(thisEntries: DailyEntry[], lastEntries: DailyEntry[]): WeekComparison {
  const thisWeek = summariseWeek(thisEntries);
  const lastWeek = summariseWeek(lastEntries);
  const sleepScore = thisWeek.wakeTotal + thisWeek.bedTotal;
  const lastSleepScore = lastWeek.wakeTotal + lastWeek.bedTotal;
  return {
    thisWeek,
    lastWeek,
    improving:
      thisWeek.japaTotal >= lastWeek.japaTotal &&
      sleepScore >= lastSleepScore &&
      thisWeek.readingMinutes >= lastWeek.readingMinutes,
    lowReading: thisWeek.avgReadingPerDay < 60,
    lowHearing:
      thisWeek.spLectureMinutes < 120 ||
      thisWeek.gmLectureMinutes < 120 ||
      thisWeek.rspLectureMinutes < 60,
    missedMorningProgram: thisWeek.daysLogged > 0 && thisWeek.morningProgramDays < thisWeek.daysLogged,
    irregularSleep: thisWeek.daysLogged >= 3 && sleepScore / (thisWeek.daysLogged * 50) < 0.6,
  };
}

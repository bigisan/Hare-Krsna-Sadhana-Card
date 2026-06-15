// Storage layer. Authed users read and write Supabase (RLS scoped);
// guests use localStorage on this device only.

import { addDays, format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "./supabase";
import { DailyEntry, emptyEntry, DAY_KEYS } from "./sadhana-types";

const GUEST_PREFIX = "sadhana:entry:";
const GUEST_SETTINGS = "sadhana:settings";
const DRAFT_PREFIX = "sadhana:draft:";
const BACKUP_PREFIX = "sadhana:";
const BACKUP_VERSION = 1;

export interface StorageCtx {
  userId: string | null; // null means guest
}

// ---------- row mapping ----------

type Row = Record<string, unknown>;

function toRow(userId: string, e: DailyEntry): Row {
  return {
    user_id: userId,
    date: e.date,
    day_of_week: e.dayOfWeek,
    bed_time: e.bedTime,
    bed_time_score: e.bedTimeScore,
    wake_up_time: e.wakeUpTime,
    wake_up_score: e.wakeUpScore,
    japa_completion_time: e.japaCompletionTime,
    japa_score: e.japaScore,
    japa_rounds: e.japaRounds,
    mangala_arati: e.mangalaArati,
    tulasi_arati: e.tulasiArati,
    darshan_arati: e.darshanArati,
    guru_puja: e.guruPuja,
    bhagavatam_class: e.bhagavatamClass,
    deity_darshan: e.deityDarshan,
    sloka_memorisation: e.slokaMemorisation,
    yoga: e.yoga,
    book_distribution: e.bookDistribution,
    bd_hours: e.bdHours,
    instrument_practice: e.instrumentPractice,
    gaura_arati: e.gauraArati,
    sp_books_minutes: e.spBooksMinutes,
    sp_lectures_minutes: e.spLecturesMinutes,
    guru_maharaja_minutes: e.guruMaharajaMinutes,
    rsp_lectures_minutes: e.rspLecturesMinutes,
  };
}

function fromRow(r: Row): DailyEntry {
  return {
    date: r.date as string,
    dayOfWeek: r.day_of_week as string,
    bedTime: (r.bed_time as string | null) ?? null,
    bedTimeScore: (r.bed_time_score as number) ?? 0,
    wakeUpTime: (r.wake_up_time as string | null) ?? null,
    wakeUpScore: (r.wake_up_score as number) ?? 0,
    japaCompletionTime: (r.japa_completion_time as string | null) ?? null,
    japaScore: (r.japa_score as number) ?? 0,
    japaRounds: (r.japa_rounds as number) ?? 16,
    mangalaArati: !!r.mangala_arati,
    tulasiArati: !!r.tulasi_arati,
    darshanArati: !!r.darshan_arati,
    guruPuja: !!r.guru_puja,
    bhagavatamClass: !!r.bhagavatam_class,
    deityDarshan: !!r.deity_darshan,
    slokaMemorisation: !!r.sloka_memorisation,
    yoga: !!r.yoga,
    bookDistribution: !!r.book_distribution,
    bdHours: (r.bd_hours as number) ?? 0,
    instrumentPractice: !!r.instrument_practice,
    gauraArati: !!r.gaura_arati,
    spBooksMinutes: (r.sp_books_minutes as number) ?? 0,
    spLecturesMinutes: (r.sp_lectures_minutes as number) ?? 0,
    guruMaharajaMinutes: (r.guru_maharaja_minutes as number) ?? 0,
    rspLecturesMinutes: (r.rsp_lectures_minutes as number) ?? 0,
  };
}

// ---------- daily entries ----------

export async function saveDailyEntry(ctx: StorageCtx, entry: DailyEntry): Promise<void> {
  if (ctx.userId && supabase) {
    const { error } = await supabase
      .from("daily_entries")
      .upsert(toRow(ctx.userId, entry), { onConflict: "user_id,date" });
    if (error) throw error;
  } else {
    localStorage.setItem(GUEST_PREFIX + entry.date, JSON.stringify(entry));
  }
}

export async function getDailyEntry(ctx: StorageCtx, date: string): Promise<DailyEntry | null> {
  if (ctx.userId && supabase) {
    const { data, error } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : null;
  }
  const raw = localStorage.getItem(GUEST_PREFIX + date);
  return raw ? (JSON.parse(raw) as DailyEntry) : null;
}

async function getEntriesBetween(ctx: StorageCtx, from: string, to: string): Promise<DailyEntry[]> {
  if (ctx.userId && supabase) {
    const { data, error } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .gte("date", from)
      .lte("date", to)
      .order("date");
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  const out: DailyEntry[] = [];
  let d = parseISO(from);
  const end = parseISO(to);
  while (d <= end) {
    const key = GUEST_PREFIX + format(d, "yyyy-MM-dd");
    const raw = localStorage.getItem(key);
    if (raw) out.push(JSON.parse(raw));
    d = addDays(d, 1);
  }
  return out;
}

/** weekStartStr must be the Sunday of the week, yyyy-MM-dd. */
export async function getEntriesForWeek(ctx: StorageCtx, weekStartStr: string): Promise<DailyEntry[]> {
  const end = format(addDays(parseISO(weekStartStr), 6), "yyyy-MM-dd");
  return getEntriesBetween(ctx, weekStartStr, end);
}

export async function getEntriesForMonth(ctx: StorageCtx, anyDateInMonth: Date): Promise<DailyEntry[]> {
  return getEntriesBetween(
    ctx,
    format(startOfMonth(anyDateInMonth), "yyyy-MM-dd"),
    format(endOfMonth(anyDateInMonth), "yyyy-MM-dd"),
  );
}

/** Map a week's entries onto SUN..SAT keys for the export and the log table. */
export function entriesByDay(entries: DailyEntry[]): Partial<Record<string, DailyEntry>> {
  const map: Partial<Record<string, DailyEntry>> = {};
  for (const e of entries) map[e.dayOfWeek] = e;
  return map;
}

// ---------- daily drafts (always device-local, resumable) ----------

export interface DailyDraft {
  step: number;
  entry: DailyEntry;
  updatedAt: string;
}

export function saveDraft(date: string, draft: { step: number; entry: DailyEntry }): DailyDraft {
  const saved = { ...draft, updatedAt: new Date().toISOString() };
  localStorage.setItem(DRAFT_PREFIX + date, JSON.stringify(saved));
  return saved;
}

export function getDraft(date: string): DailyDraft | null {
  const raw = localStorage.getItem(DRAFT_PREFIX + date);
  return raw ? JSON.parse(raw) : null;
}

export function clearDraft(date: string): void {
  localStorage.removeItem(DRAFT_PREFIX + date);
}

// ---------- settings ----------

export interface UserSettings {
  wizardMode: boolean;
}

export async function getSettings(ctx: StorageCtx): Promise<UserSettings> {
  if (ctx.userId && supabase) {
    const { data } = await supabase
      .from("user_settings")
      .select("wizard_mode")
      .eq("user_id", ctx.userId)
      .maybeSingle();
    return { wizardMode: data?.wizard_mode ?? true };
  }
  const raw = localStorage.getItem(GUEST_SETTINGS);
  return raw ? JSON.parse(raw) : { wizardMode: true };
}

export async function saveSettings(ctx: StorageCtx, s: UserSettings): Promise<void> {
  if (ctx.userId && supabase) {
    await supabase
      .from("user_settings")
      .upsert({ user_id: ctx.userId, wizard_mode: s.wizardMode }, { onConflict: "user_id" });
  } else {
    localStorage.setItem(GUEST_SETTINGS, JSON.stringify(s));
  }
}

export interface LocalBackup {
  app: "sadhana";
  version: number;
  exportedAt: string;
  items: Record<string, string>;
}

export function exportLocalBackup(): LocalBackup {
  const items: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(BACKUP_PREFIX)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) items[key] = value;
  }

  return {
    app: "sadhana",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    items,
  };
}

export function importLocalBackup(backup: LocalBackup): number {
  if (backup.app !== "sadhana" || !backup.items || typeof backup.items !== "object") {
    throw new Error("This backup file does not look like Sadhana data.");
  }

  let imported = 0;
  for (const [key, value] of Object.entries(backup.items)) {
    if (!key.startsWith(BACKUP_PREFIX) || typeof value !== "string") continue;
    localStorage.setItem(key, value);
    imported += 1;
  }
  return imported;
}

export { emptyEntry, DAY_KEYS };

import { useEffect, useMemo, useState } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DailyEntry } from "@/lib/sadhana-types";
import { getEntriesForMonth, StorageCtx } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function MonthlyProgress({ ctx, onOpenDate }: { ctx: StorageCtx; onOpenDate: (date: string) => void }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [entries, setEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    getEntriesForMonth(ctx, month)
      .then(setEntries)
      .catch(() => toast.error("Couldn't load this month; please try again. Hare Krishna 🙏"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, ctx.userId]);

  const byDate = useMemo(() => {
    const m: Record<string, DailyEntry> = {};
    for (const e of entries) m[e.date] = e;
    return m;
  }, [entries]);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = getDay(startOfMonth(month)); // 0 = Sunday

  const dayScore = (e: DailyEntry) => e.wakeUpScore + e.japaScore + e.bedTimeScore; // max 75
  const heat = (score: number) =>
    score >= 60 ? "bg-success text-success-foreground" :
    score >= 40 ? "bg-primary/70 text-primary-foreground" :
    score >= 20 ? "bg-primary/40" :
    score > 0 ? "bg-primary/20" : "bg-secondary";

  const totals = useMemo(() => {
    const sum = (f: (e: DailyEntry) => number) => entries.reduce((a, e) => a + f(e), 0);
    return {
      daysLogged: entries.length,
      rounds: sum((e) => e.japaRounds),
      mangala: entries.filter((e) => e.mangalaArati).length,
      morningAttendance: sum((e) => [e.mangalaArati, e.tulasiArati, e.darshanArati, e.guruPuja, e.bhagavatamClass].filter(Boolean).length),
      reading: sum((e) => e.spBooksMinutes),
      hearing: sum((e) => e.spLecturesMinutes + e.guruMaharajaMinutes + e.rspLecturesMinutes),
      bd: sum((e) => e.bdHours),
      bdDays: entries.filter((e) => e.bookDistribution).length,
      score: sum(dayScore),
    };
  }, [entries]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1 py-1">
        <Button variant="ghost" size="icon" aria-label="Previous month"
          onClick={() => setMonth((m) => addMonths(m, -1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-2xl font-semibold leading-none">{format(month, "MMMM yyyy")}</div>
          <div className="mt-1 text-xs font-medium text-muted-foreground">Monthly rhythm</div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Next month"
          onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <section className="quiet-surface rounded-2xl p-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leading }).map((_, i) => <div key={`x${i}`} />)}
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const e = byDate[key];
              return (
                <button key={key}
                  type="button"
                  onClick={() => onOpenDate(key)}
                  aria-label={`${format(d, "EEEE, MMMM d")}${e ? `, submitted, score ${dayScore(e)} out of 75` : ", not submitted"}. Open day`}
                  title={e ? `${key}: ${dayScore(e)} / 75` : key}
                  className={cn(
                    "pressable relative flex aspect-square min-h-10 items-center justify-center rounded-lg border text-sm font-semibold shadow-[0_1px_0_hsl(0_0%_100%_/_0.30)_inset] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    e ? `${heat(dayScore(e))} border-white/35` : "border-border/45 bg-card/55 text-muted-foreground",
                  )}>
                  {format(d, "d")}
                  {e && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-70" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground" aria-label="Calendar score legend">
            {[
              ["No entry", "bg-card"],
              ["Low", "bg-primary/20"],
              ["Steady", "bg-primary/70"],
              ["Strong", "bg-success"],
            ].map(([label, tone]) => (
              <span key={label} className="flex flex-col items-center gap-1">
                <span className={cn("h-2.5 w-8 rounded-full border border-border/50", tone)} />
                {label}
              </span>
            ))}
          </div>
      </section>

      <section className="quiet-surface overflow-hidden rounded-2xl" aria-labelledby="monthly-totals">
        <h2 id="monthly-totals" className="px-4 pb-2 pt-4 font-display text-2xl font-semibold">Monthly totals</h2>
        {[
          { title: "Practice", items: [["Logged days", totals.daysLogged], ["Total rounds", totals.rounds], ["Core score", `${totals.score} pts`]] },
          { title: "Attendance", items: [["Mangala Arati", `${totals.mangala} days`], ["Morning items", totals.morningAttendance]] },
          { title: "Study and hearing", items: [["Reading", `${totals.reading} min`], ["Lectures", `${totals.hearing} min`]] },
          { title: "Seva", items: [["Book distribution", `${totals.bd} hrs`], ["BD attendance", `${totals.bdDays} days`]] },
        ].map((group) => (
          <div key={group.title} className="border-t border-border/55 px-4 py-3">
            <h3 className="text-sm font-semibold text-primary">{group.title}</h3>
            <div className={cn("mt-2 grid divide-x divide-border/60", group.items.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
              {group.items.map(([label, value]) => (
                <div key={String(label)} className="px-3 first:pl-0 last:pr-0">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

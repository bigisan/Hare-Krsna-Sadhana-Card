import { useEffect, useMemo, useState } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyEntry } from "@/lib/sadhana-types";
import { getEntriesForMonth, StorageCtx } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function MonthlyProgress({ ctx }: { ctx: StorageCtx }) {
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
      reading: sum((e) => e.spBooksMinutes),
      hearing: sum((e) => e.spLecturesMinutes + e.guruMaharajaMinutes + e.rspLecturesMinutes),
      bd: sum((e) => e.bdHours),
      score: sum(dayScore),
    };
  }, [entries]);

  return (
    <div className="space-y-4">
      <div className="glass-control flex items-center justify-between rounded-2xl p-2">
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

      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leading }).map((_, i) => <div key={`x${i}`} />)}
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const e = byDate[key];
              return (
                <div key={key}
                  title={e ? `${key}: ${dayScore(e)} / 75` : key}
                  className={cn(
                    "pressable flex aspect-square items-center justify-center rounded-xl border border-white/30 text-xs font-semibold shadow-[0_1px_0_hsl(0_0%_100%_/_0.28)_inset]",
                    e ? heat(dayScore(e)) : "bg-card/45 text-muted-foreground",
                  )}>
                  {format(d, "d")}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Deeper green means a stronger day (wake + japa + bed, out of 75).
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="pb-2"><CardTitle className="text-xl">Monthly totals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div className="glass-control rounded-2xl p-3"><div className="text-muted-foreground">Days logged</div><div className="text-2xl font-semibold tabular-nums">{totals.daysLogged}</div></div>
          <div className="glass-control rounded-2xl p-3"><div className="text-muted-foreground">Rounds chanted</div><div className="text-2xl font-semibold tabular-nums">{totals.rounds}</div></div>
          <div className="glass-control rounded-2xl p-3"><div className="text-muted-foreground">Mangala Aratis</div><div className="text-2xl font-semibold tabular-nums">{totals.mangala}</div></div>
          <div className="glass-control rounded-2xl p-3"><div className="text-muted-foreground">Reading (min)</div><div className="text-2xl font-semibold tabular-nums">{totals.reading}</div></div>
          <div className="glass-control rounded-2xl p-3"><div className="text-muted-foreground">Hearing (min)</div><div className="text-2xl font-semibold tabular-nums">{totals.hearing}</div></div>
          <div className="glass-control rounded-2xl p-3"><div className="text-muted-foreground">BD hours</div><div className="text-2xl font-semibold tabular-nums">{totals.bd}</div></div>
        </CardContent>
      </Card>
    </div>
  );
}

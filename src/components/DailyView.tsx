import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DailyWizard } from "@/components/DailyWizard";
import { DailyEntryForm } from "@/components/DailyEntryForm";
import { DailyOverview } from "@/components/DailyOverview";
import { MotivationBanner } from "@/components/MotivationBanner";
import { DailyEntry, compareWeeks } from "@/lib/sadhana-types";
import {
  StorageCtx, getDailyEntry, saveDailyEntry, getEntriesForWeek,
} from "@/lib/storage";
import { bannerPramana, Pramana } from "@/lib/pramanas";

export function DailyView({
  ctx,
  wizardMode,
  allowCustomTime,
}: {
  ctx: StorageCtx;
  wizardMode: boolean;
  allowCustomTime: boolean;
}) {
  const [date, setDate] = useState(() => new Date());
  const [existing, setExisting] = useState<DailyEntry | null>(null);
  const [previousEntry, setPreviousEntry] = useState<DailyEntry | null>(null);
  const [weekEntries, setWeekEntries] = useState<DailyEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pramana, setPramana] = useState<Pramana | null>(null);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayLabel = format(date, "EEEE");
  const dayOfWeek = format(date, "EEE").toUpperCase();
  const selectedWeekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 0 }), [date]);
  const selectedWeekStartStr = format(selectedWeekStart, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    Promise.all([
      getDailyEntry(ctx, dateStr),
      getDailyEntry(ctx, format(addDays(date, -1), "yyyy-MM-dd")),
      getEntriesForWeek(ctx, selectedWeekStartStr),
    ])
      .then(([dayEntry, prevEntry, entries]) => {
        if (cancelled) return;
        setExisting(dayEntry);
        setPreviousEntry(prevEntry);
        setWeekEntries(entries);
      })
      .catch(() => toast.error("Couldn't load this day; please try again. Hare Krishna 🙏"))
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, selectedWeekStartStr, ctx.userId]);

  // MotivationBanner: only when both this week and last week have data,
  // and the last 3 days show a regression.
  useEffect(() => {
    let cancelled = false;
    const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd");
    const lastWeekStart = format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 0 }), -1), "yyyy-MM-dd");
    Promise.all([getEntriesForWeek(ctx, thisWeekStart), getEntriesForWeek(ctx, lastWeekStart)])
      .then(([cur, prev]) => {
        if (cancelled || cur.length === 0 || prev.length === 0) return;
        const recent = cur.filter((e) => e.date >= format(subDays(new Date(), 3), "yyyy-MM-dd"));
        const c = compareWeeks(recent, prev);
        if (!c.improving) setPramana(bannerPramana(c));
      })
      .catch(() => { /* banner is optional; stay quiet */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.userId]);

  const onSubmit = async (entry: DailyEntry) => {
    await saveDailyEntry(ctx, entry);
    setExisting(entry);
    setWeekEntries((entries) => {
      const withoutCurrent = entries.filter((item) => item.date !== entry.date);
      return [...withoutCurrent, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  return (
    <div className="space-y-4">
      <div className="glass-control flex items-center justify-between rounded-2xl p-2">
        <Button variant="ghost" size="icon" aria-label="Previous day"
          onClick={() => setDate((d) => addDays(d, -1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-2xl font-semibold leading-none">{format(date, "EEEE")}</div>
          <div className="mt-1 text-xs font-medium text-muted-foreground">{format(date, "MMMM d, yyyy")}</div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Next day"
          onClick={() => setDate((d) => addDays(d, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {pramana && <MotivationBanner pramana={pramana} />}

      {!loaded ? (
        <div className="glass-card space-y-4 rounded-2xl p-5">
          <div className="h-5 w-28 animate-pulse rounded-full bg-secondary" />
          <div className="h-10 w-52 animate-pulse rounded-md bg-secondary" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-20 animate-pulse rounded-lg bg-secondary/80" />
            <div className="h-20 animate-pulse rounded-lg bg-secondary/80" />
            <div className="h-20 animate-pulse rounded-lg bg-secondary/80" />
          </div>
        </div>
      ) : (
        <>
          <DailyOverview entry={existing} weekEntries={weekEntries} dayLabel={dayLabel} />
          {wizardMode ? (
            <DailyWizard key={dateStr} date={dateStr} dayOfWeek={dayOfWeek} existing={existing}
              allowCustomTime={allowCustomTime} onSubmit={onSubmit} />
          ) : (
            <DailyEntryForm
              key={dateStr}
              date={dateStr}
              dayOfWeek={dayOfWeek}
              existing={existing}
              previousEntry={previousEntry}
              allowCustomTime={allowCustomTime}
              onSubmit={onSubmit}
            />
          )}
        </>
      )}
    </div>
  );
}

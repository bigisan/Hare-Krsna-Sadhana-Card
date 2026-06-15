import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DailyWizard } from "@/components/DailyWizard";
import { DailyEntryForm } from "@/components/DailyEntryForm";
import { MotivationBanner } from "@/components/MotivationBanner";
import { DailyEntry, compareWeeks } from "@/lib/sadhana-types";
import {
  StorageCtx, getDailyEntry, saveDailyEntry, getEntriesForWeek,
} from "@/lib/storage";
import { bannerPramana, Pramana } from "@/lib/pramanas";

export function DailyView({ ctx, wizardMode }: { ctx: StorageCtx; wizardMode: boolean }) {
  const [date, setDate] = useState(() => new Date());
  const [existing, setExisting] = useState<DailyEntry | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pramana, setPramana] = useState<Pramana | null>(null);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayOfWeek = format(date, "EEE").toUpperCase();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getDailyEntry(ctx, dateStr)
      .then((e) => { if (!cancelled) setExisting(e); })
      .catch(() => toast.error("Couldn't load this day; please try again. Hare Krishna 🙏"))
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, ctx.userId]);

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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous day"
          onClick={() => setDate((d) => addDays(d, -1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-xl font-semibold">{format(date, "EEEE")}</div>
          <div className="text-xs text-muted-foreground">{format(date, "MMMM d, yyyy")}</div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Next day"
          onClick={() => setDate((d) => addDays(d, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {pramana && <MotivationBanner pramana={pramana} />}

      {!loaded ? (
        <div className="py-10 text-center text-muted-foreground">Loading…</div>
      ) : wizardMode ? (
        <DailyWizard key={dateStr} date={dateStr} dayOfWeek={dayOfWeek} existing={existing} onSubmit={onSubmit} />
      ) : (
        <DailyEntryForm key={dateStr} date={dateStr} dayOfWeek={dayOfWeek} existing={existing} onSubmit={onSubmit} />
      )}
    </div>
  );
}

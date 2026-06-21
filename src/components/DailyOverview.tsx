import { DailyEntry } from "@/lib/sadhana-types";
import { cn } from "@/lib/utils";

interface Props {
  entry: DailyEntry | null;
  weekEntries: DailyEntry[];
  dayLabel: string;
}

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

function dayScore(entry: DailyEntry | null) {
  if (!entry) return 0;
  return entry.wakeUpScore + entry.japaScore + entry.bedTimeScore;
}

function Stat({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="min-w-0 flex-1 px-1.5 py-1 text-center">
      <div className="min-h-7 text-[10px] font-semibold leading-tight text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold tabular-nums", emphasized ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}

export function DailyOverview({ entry, weekEntries, dayLabel }: Props) {
  const todayScore = dayScore(entry);
  const weekScore = weekEntries.reduce((sum, item) => sum + dayScore(item), 0);
  const loggedDays = weekEntries.length;
  const weekPct = clampPct((weekScore / 525) * 100);
  const complete = !!entry;

  return (
    <section className="quiet-surface overflow-hidden rounded-2xl" aria-label={`${dayLabel} progress`}>
      <div className="flex items-center justify-between gap-3 px-4 pt-3 text-xs font-semibold text-muted-foreground">
        <span>{complete ? `${dayLabel}'s card is submitted` : `Ready for ${dayLabel}`}</span>
        <span>{Math.round(weekPct)}% this week</span>
      </div>
      <div className="my-1.5 flex divide-x divide-border/70 px-2">
        <Stat label="Core Timing Score" value={`${todayScore}/75`} emphasized={complete} />
        <Stat label="Weekly core" value={`${weekScore}/525`} />
        <Stat label="Days logged" value={`${loggedDays}/7`} />
      </div>
      <div className="h-1.5 bg-secondary/75" role="progressbar" aria-label="Weekly core timing progress"
        aria-valuenow={Math.round(weekPct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary motion-safe:transition-[width]" style={{ width: `${weekPct}%` }} />
      </div>
    </section>
  );
}

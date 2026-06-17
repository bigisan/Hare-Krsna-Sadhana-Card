import { Flame, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div className={cn("glass-control rounded-xl p-3", tone === "success" && "bg-success/15")}>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</div>
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
    <Card className="overflow-hidden rounded-3xl border-primary/20 bg-[linear-gradient(145deg,hsl(42_28%_96%_/_0.92),hsl(82_20%_82%_/_0.62))] shadow-lift">
      <CardContent className="space-y-5 p-5">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">
            {complete ? `${dayLabel} submitted` : `Ready for ${dayLabel}`}
          </div>
          <h2 className="mt-1 font-display text-[2.15rem] font-semibold leading-none">Daily offering</h2>
          <p className="mt-2 text-sm text-muted-foreground">A quiet place to complete {dayLabel}&apos;s card.</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label={dayLabel} value={`${todayScore}/75`} tone={complete ? "success" : "default"} />
          <Stat label="Week" value={`${weekScore}/525`} />
          <Stat label="Days" value={`${loggedDays}/7`} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              Weekly rhythm
            </span>
            <span>{Math.round(weekPct)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary shadow-[0_1px_0_hsl(0_0%_100%_/_0.45)_inset]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(43_42%_46%))] transition-all"
              style={{ width: `${weekPct}%` }}
            />
          </div>
        </div>

        <div className="glass-control flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Saved entries stay private on this device unless you choose cloud sync.
        </div>
      </CardContent>
    </Card>
  );
}

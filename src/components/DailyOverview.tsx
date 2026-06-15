import { CheckCircle2, Circle, Flame, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DailyEntry } from "@/lib/sadhana-types";
import { cn } from "@/lib/utils";

interface Props {
  entry: DailyEntry | null;
  weekEntries: DailyEntry[];
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
    <div className={cn("rounded-md bg-secondary p-3", tone === "success" && "bg-success/15")}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function DailyOverview({ entry, weekEntries }: Props) {
  const todayScore = dayScore(entry);
  const weekScore = weekEntries.reduce((sum, item) => sum + dayScore(item), 0);
  const loggedDays = weekEntries.length;
  const weekPct = clampPct((weekScore / 525) * 100);
  const complete = !!entry;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {complete ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {complete ? "Offered today" : "Ready for today"}
            </div>
            <h2 className="mt-1 font-display text-3xl font-semibold">Daily offering</h2>
          </div>
          <div className="rounded-full bg-accent p-2 text-accent-foreground">
            <Leaf className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Today" value={`${todayScore}/75`} tone={complete ? "success" : "default"} />
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
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${weekPct}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

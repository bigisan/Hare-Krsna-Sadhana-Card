import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DailyEntry, ATTENDANCE_ITEMS, STUDY_ITEMS,
  scoreBedTime, scoreWakeUp, scoreJapa, emptyEntry,
} from "@/lib/sadhana-types";
import { clearDraft, getDraft, saveDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  dayOfWeek: string;
  existing: DailyEntry | null;
  onSubmit: (entry: DailyEntry) => Promise<void>;
}

export function DailyEntryForm({ date, dayOfWeek, existing, onSubmit }: Props) {
  const [entry, setEntry] = useState<DailyEntry>(() => existing ?? emptyEntry(date, dayOfWeek));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const draft = getDraft(date);
    if (draft) {
      setEntry(draft.entry);
      setDraftSavedAt(draft.updatedAt ?? null);
    } else {
      setEntry(existing ?? emptyEntry(date, dayOfWeek));
      setDraftSavedAt(null);
    }
    setDirty(false);
  }, [date, existing, dayOfWeek]);

  useEffect(() => {
    if (!dirty) return;
    const id = window.setTimeout(() => {
      const draft = saveDraft(date, { step: 0, entry });
      setDraftSavedAt(draft.updatedAt);
      setDirty(false);
    }, 350);
    return () => window.clearTimeout(id);
  }, [date, dirty, entry]);

  const saveProgress = () => {
    const draft = saveDraft(date, { step: 0, entry });
    setDraftSavedAt(draft.updatedAt);
    setDirty(false);
    toast.success("Progress saved. You can finish this later.");
  };

  const set = (patch: Partial<DailyEntry>) => {
    setDirty(true);
    setEntry((e) => ({ ...e, ...patch }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(entry);
      clearDraft(date);
      setDraftSavedAt(null);
      setDirty(false);
      toast.success("Today's sadhana is offered and saved. Hare Krishna 🙏");
    } catch {
      toast.error("Saving didn't go through; please try again. Hare Krishna 🙏");
    } finally {
      setSaving(false);
    }
  };

  const timeRow = (label: string, value: string | null, score: number, onChange: (v: string) => void) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Input type="time" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-32" />
        <span className="w-12 text-right text-sm font-medium text-muted-foreground">
          {value ? (score >= 0 ? `+${score}` : score) : ""}
        </span>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle>Today's Sadhana</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {timeRow("Wake up", entry.wakeUpTime, entry.wakeUpScore,
            (v) => set({ wakeUpTime: v, wakeUpScore: scoreWakeUp(v) }))}
          {timeRow("Japa finished", entry.japaCompletionTime, entry.japaScore,
            (v) => set({ japaCompletionTime: v, japaScore: scoreJapa(v) }))}
          {timeRow("To bed", entry.bedTime, entry.bedTimeScore,
            (v) => set({ bedTime: v, bedTimeScore: scoreBedTime(v) }))}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Japa rounds</span>
            <Input type="number" min={0} value={entry.japaRounds}
              onChange={(e) => set({ japaRounds: Number(e.target.value) })} className="w-24 text-center" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Attendance and seva</h3>
          <div className="flex flex-wrap gap-2">
            {ATTENDANCE_ITEMS.map(({ key, label }) => {
              const on = entry[key] as boolean;
              return (
                <button key={key as string} type="button" aria-pressed={on}
                  onClick={() => set({ [key]: !on } as Partial<DailyEntry>)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
                  )}>
                  {label}
                </button>
              );
            })}
          </div>
          {entry.bookDistribution && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-sm">Hours on Book Distribution</span>
              <Input type="number" min={0} step={0.5} value={entry.bdHours}
                onChange={(e) => set({ bdHours: Number(e.target.value) })} className="w-24 text-center" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Reading and hearing (minutes)</h3>
          {STUDY_ITEMS.map(({ key, label }) => (
            <div key={key as string} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <Input type="number" min={0} value={entry[key] as number}
                onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<DailyEntry>)}
                className="w-24 text-center" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {draftSavedAt ? "Progress saved on this device" : "Progress saves on this device"}
            </span>
            <Button variant="ghost" size="sm" onClick={saveProgress}>
              Save progress
            </Button>
          </div>
          <Button size="lg" className="w-full" onClick={submit} disabled={saving}>
            {saving ? "Offering…" : "Submit Today's Sadhana"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

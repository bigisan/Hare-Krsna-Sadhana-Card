import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AttendanceChecklist, JapaRoundsControl, MinuteEntryControl } from "@/components/DailyEntryControls";
import {
  BED_PRESETS,
  JAPA_PRESETS,
  TimePresetSelector,
  WAKE_PRESETS,
  type TimePreset,
} from "@/components/TimePresetSelector";
import {
  DailyEntry, ATTENDANCE_ITEMS, STUDY_ITEMS,
  scoreBedTime, scoreWakeUp, scoreJapa, emptyEntry,
} from "@/lib/sadhana-types";
import { saveDraft, getDraft, clearDraft } from "@/lib/storage";
import { formatTimingDisplay } from "@/lib/time-display";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  dayOfWeek: string;
  existing: DailyEntry | null;
  allowCustomTime: boolean;
  onSubmit: (entry: DailyEntry) => Promise<void>;
}

const STEPS = [
  "wake", "japa", "bed", "attendance",
  "spBooksMinutes", "spLecturesMinutes", "guruMaharajaMinutes", "rspLecturesMinutes",
  "review",
] as const;
type Step = (typeof STEPS)[number];

function ScoreChip({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/35 px-2 py-1 text-xs font-semibold shadow-[0_1px_0_hsl(0_0%_100%_/_0.35)_inset]",
        score >= 20 ? "bg-success/15 text-success" :
        score >= 10 ? "bg-accent text-accent-foreground" :
        "bg-secondary/80 text-secondary-foreground",
      )}
    >
      {score >= 0 ? `+${score}` : score} marks
    </span>
  );
}

const MINUTE_LABELS: Record<string, string> = {
  spBooksMinutes: "How many minutes did you read Srila Prabhupada's books?",
  spLecturesMinutes: "How many minutes did you hear Srila Prabhupada's lectures?",
  guruMaharajaMinutes: "How many minutes did you hear Guru Maharaj's lectures?",
  rspLecturesMinutes: "How many minutes did you hear RSP's lectures?",
};

export function DailyWizard({ date, dayOfWeek, existing, allowCustomTime, onSubmit }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [entry, setEntry] = useState<DailyEntry>(() => existing ?? emptyEntry(date, dayOfWeek));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // resume a draft for this date if one exists
  useEffect(() => {
    const draft = getDraft(date);
    if (draft) {
      setEntry(draft.entry);
      setStepIndex(draft.step);
      setDraftSavedAt(draft.updatedAt ?? null);
    } else {
      setEntry(existing ?? emptyEntry(date, dayOfWeek));
      setStepIndex(0);
      setDraftSavedAt(null);
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // autosave draft on every change so the devotee can leave and resume
  useEffect(() => {
    if (!dirty) return;
    const id = window.setTimeout(() => {
      const draft = saveDraft(date, { step: stepIndex, entry });
      setDraftSavedAt(draft.updatedAt);
      setDirty(false);
    }, 350);
    return () => window.clearTimeout(id);
  }, [date, dirty, entry, stepIndex]);

  const step: Step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const dayName = format(parseISO(date), "EEEE");
  const entryTitle = `${dayName}'s Sadhana`;

  const saveProgress = () => {
    const draft = saveDraft(date, { step: stepIndex, entry });
    setDraftSavedAt(draft.updatedAt);
    setDirty(false);
    toast.success("Progress saved. You can finish this later.");
  };

  const set = (patch: Partial<DailyEntry>) => {
    setDirty(true);
    setEntry((e) => ({ ...e, ...patch }));
  };

  const next = () => {
    setDirty(true);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const back = () => {
    setDirty(true);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(entry);
      clearDraft(date);
      setDraftSavedAt(null);
      setDirty(false);
      setStepIndex(0);
      toast.success(`${entryTitle} is offered and saved. Hare Krishna.`);
    } catch {
      toast.error("Saving didn't go through. Your answers are kept on this device; try again. Hare Krishna 🙏");
    } finally {
      setSaving(false);
    }
  };

  const timeQuestion = (
    title: string,
    value: string | null,
    score: number,
    presets: TimePreset[],
    onPresetSelect: (preset: TimePreset) => void,
    onCustomTimeChange: (time: string) => void,
    note?: string,
  ) => (
    <div className="space-y-5">
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      <TimePresetSelector
        title={title}
        value={value}
        score={score}
        presets={presets}
        allowCustomTime={allowCustomTime}
        onPresetSelect={onPresetSelect}
        onCustomTimeChange={onCustomTimeChange}
      />
      <Button size="lg" className="w-full" disabled={!value} onClick={next}>
        Continue
      </Button>
    </div>
  );

  const body = useMemo(() => {
    switch (step) {
      case "wake":
        return timeQuestion(
          "Nidra: Wake up",
          entry.wakeUpTime,
          entry.wakeUpScore,
          WAKE_PRESETS,
          (preset) => set({ wakeUpTime: preset.time, wakeUpScore: preset.score }),
          (time) => set({ wakeUpTime: time, wakeUpScore: scoreWakeUp(time) }),
        );
      case "japa":
        return (
          <div className="space-y-5">
            <TimePresetSelector
              title="Japa completion"
              value={entry.japaCompletionTime}
              score={entry.japaScore}
              presets={JAPA_PRESETS}
              allowCustomTime={allowCustomTime}
              onPresetSelect={(preset) => set({ japaCompletionTime: preset.time, japaScore: preset.score })}
              onCustomTimeChange={(time) => set({ japaCompletionTime: time, japaScore: scoreJapa(time) })}
            />
            <JapaRoundsControl value={entry.japaRounds} onChange={(japaRounds) => set({ japaRounds })} />
            <Button size="lg" className="w-full" disabled={!entry.japaCompletionTime} onClick={next}>
              Continue
            </Button>
          </div>
        );
      case "bed":
        return timeQuestion(
          "Nidra: Sleep",
          entry.bedTime,
          entry.bedTimeScore,
          BED_PRESETS,
          (preset) => set({ bedTime: preset.time, bedTimeScore: preset.score }),
          (time) => set({ bedTime: time, bedTimeScore: scoreBedTime(time) }),
          `Recorded against ${dayName}.`,
        );
      case "attendance":
        return (
          <div className="space-y-5">
            <h2 className="text-center font-display text-3xl font-semibold">
              What did you attend on {dayName}?
            </h2>
            <AttendanceChecklist
              entry={entry}
              onToggle={(key) => set({ [key]: !entry[key] } as Partial<DailyEntry>)}
            />
            {entry.bookDistribution && (
              <div className="space-y-1 text-center">
                <label htmlFor="bdh" className="block text-sm text-muted-foreground">
                  Hours on Book Distribution
                </label>
                <Input
                  id="bdh"
                  type="number"
                  min={0}
                  step={0.5}
                  value={entry.bdHours}
                  onChange={(e) => set({ bdHours: Number(e.target.value) })}
                  className="mx-auto w-28 text-center"
                />
              </div>
            )}
            <Button size="lg" className="w-full" onClick={next}>Continue</Button>
          </div>
        );
      case "review": {
        const total = entry.wakeUpScore + entry.japaScore + entry.bedTimeScore;
        return (
          <div className="space-y-5 text-center">
            <h2 className="font-display text-3xl font-semibold">Review and offer</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="glass-control rounded-xl p-2">
                <div className="text-muted-foreground">Wake</div>
                <div className="my-1 min-h-8 text-xs font-semibold leading-tight">{formatTimingDisplay("wake", entry.wakeUpTime, entry.wakeUpScore)}</div>
                <ScoreChip score={entry.wakeUpScore} />
              </div>
              <div className="glass-control rounded-xl p-2">
                <div className="text-muted-foreground">Japa</div>
                <div className="my-1 min-h-8 text-xs font-semibold leading-tight">{formatTimingDisplay("japa", entry.japaCompletionTime, entry.japaScore)}</div>
                <ScoreChip score={entry.japaScore} />
              </div>
              <div className="glass-control rounded-xl p-2">
                <div className="text-muted-foreground">Bed</div>
                <div className="my-1 min-h-8 text-xs font-semibold leading-tight">{formatTimingDisplay("sleep", entry.bedTime, entry.bedTimeScore)}</div>
                <ScoreChip score={entry.bedTimeScore} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.japaRounds} rounds · {ATTENDANCE_ITEMS.filter((i) => entry[i.key]).length} items attended ·
              day score {total} / 75
            </p>
            <Button size="lg" className="w-full" onClick={submit} disabled={saving}>
              {saving ? "Submitting…" : "Submit Day"}
            </Button>
          </div>
        );
      }
      default: {
        const key = step as keyof DailyEntry;
        return (
          <div className="space-y-5">
            <h2 className="text-center font-display text-2xl font-semibold">{MINUTE_LABELS[step]}</h2>
            <MinuteEntryControl
              id={`wizard-${String(key)}`}
              label="Minutes"
              value={entry[key] as number}
              onChange={(value) => set({ [key]: value } as Partial<DailyEntry>)}
            />
            <Button size="lg" className="w-full" onClick={next}>Continue</Button>
          </div>
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, entry, saving, allowCustomTime]);

  return (
    <div className="space-y-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/70 shadow-[0_1px_0_hsl(0_0%_100%_/_0.35)_inset]" role="progressbar"
        aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="quiet-surface flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          {draftSavedAt ? "Draft saved on this device" : "Draft autosaves on this device"}
        </span>
        <Button variant="ghost" size="sm" onClick={saveProgress}>
          Save Draft
        </Button>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="relative pt-8">
          {stepIndex > 0 && (
            <button
              onClick={back}
              aria-label="Back"
              className="pressable glass-control absolute left-4 top-4 rounded-md p-2 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {body}
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            Drafts stay on this device until submitted. Submitted days appear in Weekly and PDF export.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

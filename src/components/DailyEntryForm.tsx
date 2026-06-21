import { type ReactNode, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, ChevronDown, Copy, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttendanceChecklist, JapaRoundsControl, MinuteEntryControl } from "@/components/DailyEntryControls";
import {
  BED_PRESETS,
  JAPA_PRESETS,
  TimePresetSelector,
  WAKE_PRESETS,
} from "@/components/TimePresetSelector";
import {
  DailyEntry, ATTENDANCE_ITEMS, STUDY_ITEMS,
  scoreBedTime, scoreWakeUp, scoreJapa, emptyEntry,
} from "@/lib/sadhana-types";
import { clearDraft, getDraft, saveDraft } from "@/lib/storage";
import { formatTimingDisplay } from "@/lib/time-display";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  dayOfWeek: string;
  existing: DailyEntry | null;
  previousEntry: DailyEntry | null;
  allowCustomTime: boolean;
  onSubmit: (entry: DailyEntry) => Promise<void>;
}

type SectionKey = "core" | "attendance" | "reading";

function Section({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="quiet-surface overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="pressable flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-5 border-t border-border/55 px-4 py-4">{children}</div>}
    </section>
  );
}

export function DailyEntryForm({ date, dayOfWeek, existing, previousEntry, allowCustomTime, onSubmit }: Props) {
  const [entry, setEntry] = useState<DailyEntry>(() => existing ?? emptyEntry(date, dayOfWeek));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    core: true,
    attendance: true,
    reading: false,
  });

  const dayName = format(parseISO(date), "EEEE");
  const title = `${dayName}'s Sadhana`;
  const coreScore = entry.wakeUpScore + entry.japaScore + entry.bedTimeScore;
  const attendedCount = ATTENDANCE_ITEMS.filter((item) => entry[item.key]).length;
  const readingMinutes = STUDY_ITEMS.reduce((total, item) => total + ((entry[item.key] as number) || 0), 0);

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

  const set = (patch: Partial<DailyEntry>) => {
    setDirty(true);
    setEntry((current) => ({ ...current, ...patch }));
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveProgress = () => {
    const draft = saveDraft(date, { step: 0, entry });
    setDraftSavedAt(draft.updatedAt);
    setDirty(false);
    toast.success(`Progress saved for ${dayName}.`);
  };

  const copyPrevious = () => {
    if (!previousEntry) return;
    set({ ...previousEntry, date, dayOfWeek });
    toast.success(`Copied the previous day's entry into ${dayName}.`);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(entry);
      clearDraft(date);
      setDraftSavedAt(null);
      setDirty(false);
      toast.success(`${title} is offered and saved. Hare Krishna.`);
    } catch {
      toast.error("Saving didn't go through; please try again. Hare Krishna.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <header className="space-y-3 px-1 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[2rem] font-semibold leading-none">{title}</h2>
          </div>
          <div className="quiet-surface rounded-xl px-3 py-1.5 text-center">
            <div className="text-[11px] font-semibold text-muted-foreground">Core Timing Score</div>
            <div className="text-xl font-semibold tabular-nums">{coreScore}/75</div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={copyPrevious}
          disabled={!previousEntry}
        >
          <Copy className="h-4 w-4" />
          {previousEntry ? "Copy Previous Day" : "No previous day to copy"}
        </Button>
      </header>

      <div className="space-y-3">
        <Section
          title="Daily timings"
          summary={`${formatTimingDisplay("wake", entry.wakeUpTime, entry.wakeUpScore)} · ${formatTimingDisplay("japa", entry.japaCompletionTime, entry.japaScore)} · ${formatTimingDisplay("sleep", entry.bedTime, entry.bedTimeScore)}`}
          open={openSections.core}
          onToggle={() => toggleSection("core")}
        >
          <TimePresetSelector
            title="Nidra: Wake up"
            value={entry.wakeUpTime}
            score={entry.wakeUpScore}
            presets={WAKE_PRESETS}
            allowCustomTime={allowCustomTime}
            onPresetSelect={(preset) => set({ wakeUpTime: preset.time, wakeUpScore: preset.score })}
            onCustomTimeChange={(time) => set({ wakeUpTime: time, wakeUpScore: scoreWakeUp(time) })}
          />
          <TimePresetSelector
            title="Japa"
            value={entry.japaCompletionTime}
            score={entry.japaScore}
            presets={JAPA_PRESETS}
            allowCustomTime={allowCustomTime}
            onPresetSelect={(preset) => set({ japaCompletionTime: preset.time, japaScore: preset.score })}
            onCustomTimeChange={(time) => set({ japaCompletionTime: time, japaScore: scoreJapa(time) })}
          />
          <JapaRoundsControl value={entry.japaRounds} onChange={(japaRounds) => set({ japaRounds })} />
          <TimePresetSelector
            title="Nidra: Sleep"
            value={entry.bedTime}
            score={entry.bedTimeScore}
            presets={BED_PRESETS}
            allowCustomTime={allowCustomTime}
            onPresetSelect={(preset) => set({ bedTime: preset.time, bedTimeScore: preset.score })}
            onCustomTimeChange={(time) => set({ bedTime: time, bedTimeScore: scoreBedTime(time) })}
          />
        </Section>

        <Section
          title="Attendance and seva"
          summary={`${attendedCount} selected`}
          open={openSections.attendance}
          onToggle={() => toggleSection("attendance")}
        >
          <AttendanceChecklist
            entry={entry}
            onToggle={(key) => set({ [key]: !entry[key] } as Partial<DailyEntry>)}
          />
          {entry.bookDistribution && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/55 bg-card/75 p-3">
              <label htmlFor="bd-hours" className="text-sm font-medium">Book distribution hours</label>
              <Input
                id="bd-hours"
                type="number"
                min={0}
                step={0.5}
                value={entry.bdHours}
                onChange={(e) => set({ bdHours: Number(e.target.value) })}
                className="h-11 w-24 text-center"
              />
            </div>
          )}
        </Section>

        <Section
          title="Reading and hearing"
          summary={`${readingMinutes} minutes`}
          open={openSections.reading}
          onToggle={() => toggleSection("reading")}
        >
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Reading</h3>
            <MinuteEntryControl
              id="spBooksMinutes"
              label="Srila Prabhupada books"
              value={entry.spBooksMinutes}
              onChange={(spBooksMinutes) => set({ spBooksMinutes })}
            />
          </div>
          <div className="border-t border-border/55 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Hearing</h3>
            {STUDY_ITEMS.slice(1).map(({ key, label }) => (
              <MinuteEntryControl
                key={key as string}
                id={key as string}
                label={label.replace("'s", "")}
                value={entry[key] as number}
                onChange={(value) => set({ [key]: value } as Partial<DailyEntry>)}
              />
            ))}
          </div>
        </Section>

        <div className="sticky bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-30 -mx-1 space-y-2 rounded-2xl border border-white/60 bg-background/[0.92] p-2 shadow-[0_-8px_28px_hsl(40_18%_18%_/_0.10)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {draftSavedAt ? "Draft saved on this device" : "Draft autosaves on this device"}
            </span>
            <Button variant="ghost" size="sm" onClick={saveProgress}>
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          </div>
          <Button size="lg" className="w-full shadow-lift" onClick={submit} disabled={saving}>
            <Send className="h-4 w-4" />
            {saving ? "Submitting..." : "Submit Day"}
          </Button>
          <p className="px-2 pb-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            Drafts stay on this device until submitted. Submitted days appear in Weekly and PDF export.
          </p>
        </div>
      </div>
    </section>
  );
}

import { type ReactNode, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, ChevronDown, Copy, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <section className="glass-card overflow-hidden rounded-2xl">
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
      {open && <div className="space-y-4 border-t border-white/30 px-4 py-4">{children}</div>}
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
    <Card className="rounded-3xl">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick entry</p>
            <CardTitle className="mt-1">{title}</CardTitle>
          </div>
          <div className="glass-control rounded-2xl px-3 py-2 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Core</div>
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
          {previousEntry ? "Use previous day" : "No previous day to copy"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <Section
          title="Daily timings"
          summary={`${entry.wakeUpTime ?? "Wake"} · ${entry.japaCompletionTime ?? "Japa"} · ${entry.bedTime ?? "Bed"}`}
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
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/30 bg-card/50 p-3">
            <label htmlFor="japa-rounds" className="text-sm font-medium">Japa rounds</label>
            <Input
              id="japa-rounds"
              type="number"
              min={0}
              value={entry.japaRounds}
              onChange={(e) => set({ japaRounds: Number(e.target.value) })}
              className="h-11 w-24 text-center"
            />
          </div>
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
          <div className="grid grid-cols-2 gap-2">
            {ATTENDANCE_ITEMS.map(({ key, label }) => {
              const on = entry[key] as boolean;
              return (
                <button
                  key={key as string}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ [key]: !on } as Partial<DailyEntry>)}
                  className={cn(
                    "pressable flex min-h-12 items-center justify-center rounded-xl border px-2.5 py-2 text-center text-sm font-semibold leading-tight transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_hsl(82_24%_24%_/_0.18)]"
                      : "border-white/40 bg-card/55 text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {entry.bookDistribution && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/30 bg-card/50 p-3">
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
          {STUDY_ITEMS.map(({ key, label }) => (
            <div key={key as string} className="flex items-center justify-between gap-3 rounded-2xl border border-white/30 bg-card/50 p-3">
              <label htmlFor={key as string} className="text-sm font-medium leading-tight">{label}</label>
              <Input
                id={key as string}
                type="number"
                min={0}
                value={entry[key] as number}
                onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<DailyEntry>)}
                className="h-11 w-24 text-center"
              />
            </div>
          ))}
        </Section>

        <div className="sticky bottom-3 z-20 space-y-2 pb-[env(safe-area-inset-bottom)]">
          <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {draftSavedAt ? "Saved on this device" : "Autosaves on this device"}
            </span>
            <Button variant="ghost" size="sm" onClick={saveProgress}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
          <Button size="lg" className="w-full shadow-lift" onClick={submit} disabled={saving}>
            <Send className="h-4 w-4" />
            {saving ? "Offering..." : `Submit ${title}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TimePreset {
  label: string;
  time: string;
  score: number;
}

interface Props {
  title: string;
  value: string | null;
  score: number;
  presets: TimePreset[];
  allowCustomTime: boolean;
  onPresetSelect: (preset: TimePreset) => void;
  onCustomTimeChange: (time: string) => void;
}

const formatScore = (score: number) => `${score} marks`;

export function TimePresetSelector({
  title,
  value,
  score,
  presets,
  allowCustomTime,
  onPresetSelect,
  onCustomTimeChange,
}: Props) {
  const selectedPreset = presets.find((preset) => preset.time === value && preset.score === score);

  return (
    <section className="space-y-3 border-b border-border/55 pb-5 last:border-b-0 last:pb-0" aria-labelledby={`time-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={`time-${title.toLowerCase().replaceAll(" ", "-")}`} className="font-display text-2xl font-semibold">{title}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
            value ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
          )}
        >
          {value ? formatScore(score) : "Not selected"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset, index) => {
          const selected = selectedPreset === preset;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onPresetSelect(preset)}
              className={cn(
                "pressable relative min-h-[4.5rem] rounded-xl border px-3 py-2 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index === presets.length - 1 && presets.length % 2 === 1 && "col-span-2",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_hsl(82_24%_24%_/_0.20)]"
                  : "border-white/45 bg-card/60 text-secondary-foreground hover:bg-accent",
              )}
            >
              {selected && <Check className="absolute right-2 top-2 h-4 w-4" aria-hidden="true" />}
              <span className="block pr-4 text-sm font-semibold leading-tight">{preset.label}</span>
              <span className={cn("mt-1 block text-xs font-medium", selected ? "text-white/75" : "text-muted-foreground")}>
                {formatScore(preset.score)}
              </span>
            </button>
          );
        })}
      </div>

      {allowCustomTime && (
        <div className="glass-control flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
          <label className="text-sm font-medium" htmlFor={`custom-${title.toLowerCase().replaceAll(" ", "-")}`}>
            Enter exact time
          </label>
          <Input
            id={`custom-${title.toLowerCase().replaceAll(" ", "-")}`}
            type="time"
            value={value ?? ""}
            onChange={(event) => onCustomTimeChange(event.target.value)}
            className="h-11 w-32 text-center"
          />
        </div>
      )}

      {!allowCustomTime && value && !selectedPreset && (
        <p className="text-xs text-muted-foreground">
          Exact time saved previously: {value}. Choose a button to update it.
        </p>
      )}
    </section>
  );
}

export const WAKE_PRESETS: TimePreset[] = [
  { label: "3:45 am or before", time: "03:45", score: 25 },
  { label: "before 4:00 am", time: "04:00", score: 20 },
  { label: "before 4:15 am", time: "04:15", score: 15 },
  { label: "before 4:30 am", time: "04:30", score: 10 },
  { label: "before 4:45 am", time: "04:45", score: 5 },
  { label: "before 5:00 am", time: "05:00", score: 0 },
  { label: "after 5:00 am", time: "05:01", score: -5 },
];

export const JAPA_PRESETS: TimePreset[] = [
  { label: "7:15 am or before", time: "07:15", score: 25 },
  { label: "before 9:00 am", time: "09:00", score: 20 },
  { label: "before 9:15 am", time: "09:15", score: 15 },
  { label: "before 9:30 am", time: "09:30", score: 10 },
  { label: "before 9:45 am", time: "09:45", score: 5 },
  { label: "10:00 - 10:15 am", time: "10:15", score: 0 },
  { label: "after 10:15 am", time: "10:16", score: -5 },
];

export const BED_PRESETS: TimePreset[] = [
  { label: "8:45 pm or before", time: "20:45", score: 25 },
  { label: "before 9:00 pm", time: "21:00", score: 20 },
  { label: "before 9:15 pm", time: "21:15", score: 15 },
  { label: "before 9:30 pm", time: "21:30", score: 10 },
  { label: "before 9:45 pm", time: "21:45", score: 5 },
  { label: "before 10:00 pm", time: "22:00", score: 0 },
  { label: "after 10:00 pm", time: "22:01", score: -5 },
];

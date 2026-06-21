import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TimePreset } from "@/lib/time-display";
import { cn } from "@/lib/utils";

export { BED_PRESETS, JAPA_PRESETS, WAKE_PRESETS, type TimePreset } from "@/lib/time-display";

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
        <h3 id={`time-${title.toLowerCase().replaceAll(" ", "-")}`} className="font-display text-[1.65rem] font-semibold leading-none">{title}</h3>
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
                  : "border-border/65 bg-card/75 text-secondary-foreground hover:border-primary/35 hover:bg-accent/45",
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/55 bg-card/75 px-3 py-2.5">
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
          A custom exact time is saved for this entry. Choose a preset to update it, or enable exact time entry in Settings.
        </p>
      )}
    </section>
  );
}

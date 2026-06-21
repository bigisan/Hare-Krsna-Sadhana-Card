import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ATTENDANCE_ITEMS, type DailyEntry } from "@/lib/sadhana-types";
import { cn } from "@/lib/utils";

const ROUND_PRESETS = [0, 4, 8, 12, 16];
const MINUTE_PRESETS = [0, 15, 30, 45, 60];

type AttendanceKey = (typeof ATTENDANCE_ITEMS)[number]["key"];

const ATTENDANCE_GROUPS: Array<{ title: string; keys: AttendanceKey[] }> = [
  {
    title: "Morning program",
    keys: ["mangalaArati", "tulasiArati", "darshanArati", "guruPuja", "bhagavatamClass"],
  },
  {
    title: "Daily practice",
    keys: ["deityDarshan", "slokaMemorisation", "yoga", "gauraArati"],
  },
  {
    title: "Service and skills",
    keys: ["bookDistribution", "instrumentPractice"],
  },
];

function PresetButton({ selected, children, onClick, label }: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "pressable min-h-11 min-w-11 rounded-xl border px-2.5 text-sm font-semibold tabular-nums",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border/70 bg-card text-secondary-foreground hover:border-primary/40 hover:bg-accent/45",
      )}
    >
      {children}
    </button>
  );
}

export function JapaRoundsControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-3 rounded-2xl bg-secondary/45 p-3.5" aria-labelledby="japa-rounds-label">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p id="japa-rounds-label" className="text-sm font-semibold">Rounds chanted</p>
          <p className="text-xs text-muted-foreground">Choose a common count or enter the exact number.</p>
        </div>
        {value === 16 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-1 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5" /> 16
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {ROUND_PRESETS.map((rounds) => (
          <PresetButton key={rounds} selected={value === rounds} onClick={() => onChange(rounds)} label={`${rounds} rounds`}>
            {rounds}
          </PresetButton>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="japa-rounds-exact" className="text-sm text-muted-foreground">Exact rounds</label>
        <Input id="japa-rounds-exact" type="number" min={0} value={value}
          onChange={(event) => onChange(Number(event.target.value))} className="h-11 w-24 text-center" />
      </div>
    </div>
  );
}

export function MinuteEntryControl({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold leading-tight">{label}</label>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{value} min</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {MINUTE_PRESETS.map((minutes) => (
          <PresetButton key={minutes} selected={value === minutes} onClick={() => onChange(minutes)} label={`${label}, ${minutes} minutes`}>
            {minutes}
          </PresetButton>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <label htmlFor={id} className="text-xs text-muted-foreground">Exact</label>
        <Input id={id} type="number" min={0} value={value}
          onChange={(event) => onChange(Number(event.target.value))} className="h-11 w-24 text-center" />
      </div>
    </div>
  );
}

export function AttendanceChecklist({ entry, onToggle }: {
  entry: DailyEntry;
  onToggle: (key: AttendanceKey) => void;
}) {
  const labels = new Map(ATTENDANCE_ITEMS.map((item) => [item.key, item.label]));

  return (
    <div className="space-y-5">
      {ATTENDANCE_GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{group.title}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {group.keys.map((key) => {
              const selected = Boolean(entry[key]);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggle(key)}
                  className={cn(
                    "pressable flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary/60 bg-primary/12 text-foreground"
                      : "border-border/60 bg-card/70 text-secondary-foreground hover:bg-accent/35",
                  )}
                >
                  <span className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background/65",
                  )}>
                    {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                  <span className="leading-tight">{labels.get(key)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export interface TimePreset {
  label: string;
  time: string;
  score: number;
}

export type TimingKind = "wake" | "japa" | "sleep";

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

const PRESETS_BY_KIND: Record<TimingKind, TimePreset[]> = {
  wake: WAKE_PRESETS,
  japa: JAPA_PRESETS,
  sleep: BED_PRESETS,
};

function formatExactTime(time: string): string {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatTimingDisplay(kind: TimingKind, time: string | null, score: number): string {
  if (!time) return "Not recorded";

  // Presets currently store representative clock times. Matching both the time and score
  // lets old entries display their bracket honestly. A future schema can store input type
  // and timing bracket separately, while retaining the exact time only for custom entries.
  const preset = PRESETS_BY_KIND[kind].find((item) => item.time === time.slice(0, 5) && item.score === score);
  return preset?.label ?? formatExactTime(time);
}

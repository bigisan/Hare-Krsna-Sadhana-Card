import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "pressable relative inline-flex h-8 w-14 shrink-0 touch-manipulation items-center rounded-full border border-white/35 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary shadow-[0_8px_18px_hsl(82_24%_24%_/_0.22)]" : "bg-input/70 shadow-[0_1px_0_hsl(0_0%_100%_/_0.38)_inset]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-6 w-6 rounded-full bg-card shadow-soft transition-transform",
          checked ? "translate-x-7" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

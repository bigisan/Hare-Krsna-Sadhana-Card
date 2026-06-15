import { useState } from "react";
import { X } from "lucide-react";
import type { Pramana } from "@/lib/pramanas";

export function MotivationBanner({ pramana }: { pramana: Pramana }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="relative rounded-lg border border-accent bg-accent/60 p-4 pr-10 text-accent-foreground">
      <button onClick={() => setDismissed(true)} aria-label="Dismiss"
        className="absolute right-2 top-2 rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X className="h-4 w-4" />
      </button>
      <p className="font-display text-lg italic leading-snug">"{pramana.text}"</p>
      <p className="mt-1 text-xs font-medium">{pramana.reference}</p>
      <p className="mt-2 text-sm">{pramana.encouragement}</p>
    </div>
  );
}

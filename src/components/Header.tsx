import { CalendarDays, FileText, Home, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type View = "daily" | "weekly" | "monthly";

export function Header({
  view, onViewChange, onOpenSettings,
}: {
  view: View;
  onViewChange: (v: View) => void;
  onOpenSettings: () => void;
}) {
  const { isGuest, signOut } = useAuth();
  const nav = [
    { key: "daily", label: "Daily", icon: Home },
    { key: "weekly", label: "Weekly", icon: FileText },
    { key: "monthly", label: "Monthly", icon: CalendarDays },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-white/35 bg-background/72 shadow-[0_12px_32px_hsl(40_18%_18%_/_0.10)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/58">
      <div className="relative mx-auto max-w-lg px-4 pb-3 pt-4">
        {/* lotus watermark */}
        <svg aria-hidden viewBox="0 0 100 60" className="pointer-events-none absolute right-2 top-1 h-14 w-24 opacity-[0.07]">
          <path d="M50 8 C42 22 42 36 50 50 C58 36 58 8 50 8 Z M50 50 C38 42 24 40 12 46 C22 54 38 56 50 50 Z M50 50 C62 42 76 40 88 46 C78 54 62 56 50 50 Z M50 50 C40 38 28 30 14 30 C20 42 34 50 50 50 Z M50 50 C60 38 72 30 86 30 C80 42 66 50 50 50 Z" fill="currentColor"/>
          <path d="M50 14 C47 20 47 26 50 31 C53 26 53 20 50 14 Z" fill="currentColor"/>
        </svg>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="glass-control grid h-11 w-11 place-items-center rounded-xl bg-primary/90 text-primary-foreground shadow-lift">
              <FileText className="h-5 w-5" />
            </div>
            <div>
            <h1 className="font-display text-[1.95rem] font-semibold leading-none">Sadhana Card</h1>
            {isGuest && (
              <span className="glass-control mt-1 inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold text-secondary-foreground">
                Guest
              </span>
            )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Settings" onClick={onOpenSettings}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="glass-control mt-4 grid grid-cols-3 gap-1 rounded-xl p-1" aria-label="Views">
          {nav.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => onViewChange(key)} aria-current={view === key ? "page" : undefined}
              className={cn(
                "pressable inline-flex min-h-10 touch-manipulation items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                view === key
                  ? "bg-primary text-primary-foreground shadow-[0_10px_20px_hsl(82_24%_24%_/_0.22),0_1px_0_hsl(0_0%_100%_/_0.22)_inset]"
                  : "text-secondary-foreground hover:bg-card/70",
              )}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

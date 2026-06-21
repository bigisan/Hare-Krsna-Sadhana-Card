import { CalendarDays, CalendarRange, FileText, Home, LogOut, Settings } from "lucide-react";
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
    { key: "daily", label: "Today", icon: Home },
    { key: "weekly", label: "Week", icon: CalendarRange },
    { key: "monthly", label: "Month", icon: CalendarDays },
  ] as const;

  return (
    <>
      <header className="app-top-bar sticky top-0 z-40">
        <div className="mx-auto max-w-lg px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary text-primary-foreground shadow-soft">
              <FileText className="h-[1.125rem] w-[1.125rem]" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[1.65rem] font-semibold leading-none">Sadhana Card</h1>
              {isGuest && (
                <span className="mt-0.5 inline-flex rounded-full bg-secondary/75 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  On this device
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
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-lg grid-cols-3 border-t border-white/60 bg-card/[0.92] px-2 pt-1.5 shadow-[0_-12px_32px_hsl(40_18%_18%_/_0.10)] backdrop-blur-2xl pb-[max(0.4rem,env(safe-area-inset-bottom))]" aria-label="Views">
        {nav.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => onViewChange(key)} aria-current={view === key ? "page" : undefined}
              className={cn(
                "pressable relative inline-flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                view === key
                  ? "bg-primary/[0.12] text-primary"
                  : "text-muted-foreground hover:bg-card hover:text-foreground",
              )}>
              {view === key && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />}
              <Icon className="h-5 w-5" />
              {label}
            </button>
        ))}
      </nav>
    </>
  );
}

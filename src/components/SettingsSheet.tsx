import { useRef, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { exportLocalBackup, importLocalBackup, LocalBackup } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsSheet({
  open, onClose, wizardMode, onWizardModeChange, allowCustomTime, onAllowCustomTimeChange,
}: {
  open: boolean;
  onClose: () => void;
  wizardMode: boolean;
  onWizardModeChange: (v: boolean) => void;
  allowCustomTime: boolean;
  onAllowCustomTimeChange: (v: boolean) => void;
}) {
  const { isGuest } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadBackup = () => {
    const backup = exportLocalBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sadhana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup file created.");
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text()) as LocalBackup;
      const count = importLocalBackup(backup);
      toast.success(`Restored ${count} saved items. Reopen the app to refresh.`);
    } catch {
      toast.error("That backup file could not be restored.");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <section className="quiet-surface overflow-hidden rounded-2xl" aria-label="Entry preferences">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">Wizard mode</p>
              <p className="text-sm text-muted-foreground">
                One question at a time. Turn off for the all-on-one-page form.
              </p>
            </div>
            <Switch checked={wizardMode} onCheckedChange={onWizardModeChange} label="Wizard mode" />
          </div>
          <div className="flex min-h-20 items-center justify-between gap-4 border-t border-border/55 px-4 py-3">
            <div>
              <p className="font-medium">Exact time entry</p>
              <p className="text-sm text-muted-foreground">
                Presets are the recommended simple mode. Turn this on to enter an exact time.
              </p>
            </div>
            <Switch checked={allowCustomTime} onCheckedChange={onAllowCustomTimeChange} label="Exact time entry" />
          </div>
        </section>

        <section className="quiet-surface rounded-2xl p-4">
          <p className="font-medium">Backup This Device</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save a copy before changing phones, browsers, or site domains.
          </p>
          {isGuest && (
            <p className="mt-3 rounded-xl bg-secondary/55 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
              Your entries are saved on this device. Back up regularly or sign in to sync.
            </p>
          )}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={downloadBackup}>
              <Download className="h-4 w-4" />
              Backup This Device
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Restore From Backup
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={restoreBackup}
          />
        </section>
      </div>
    </Sheet>
  );
}

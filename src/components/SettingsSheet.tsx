import { useRef, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { exportLocalBackup, importLocalBackup, LocalBackup } from "@/lib/storage";

export function SettingsSheet({
  open, onClose, wizardMode, onWizardModeChange,
}: {
  open: boolean;
  onClose: () => void;
  wizardMode: boolean;
  onWizardModeChange: (v: boolean) => void;
}) {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Wizard mode</p>
            <p className="text-sm text-muted-foreground">
              One question at a time. Turn off for the all-on-one-page form.
            </p>
          </div>
          <Switch checked={wizardMode} onCheckedChange={onWizardModeChange} label="Wizard mode" />
        </div>

        <div className="border-t pt-6">
          <p className="font-medium">Backup guest data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save a copy before changing phones, browsers, or site domains.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={downloadBackup}>
              <Download className="h-4 w-4" />
              Backup
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Restore
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={restoreBackup}
          />
        </div>
      </div>
    </Sheet>
  );
}

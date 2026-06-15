import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export function SettingsSheet({
  open, onClose, wizardMode, onWizardModeChange,
}: {
  open: boolean;
  onClose: () => void;
  wizardMode: boolean;
  onWizardModeChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Wizard mode</p>
          <p className="text-sm text-muted-foreground">
            One question at a time. Turn off for the all-on-one-page form.
          </p>
        </div>
        <Switch checked={wizardMode} onCheckedChange={onWizardModeChange} label="Wizard mode" />
      </div>
    </Sheet>
  );
}

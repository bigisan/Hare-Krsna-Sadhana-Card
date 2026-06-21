import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { Header, View } from "@/components/Header";
import { DailyView } from "@/components/DailyView";
import { WeeklyView } from "@/components/WeeklyView";
import { MonthlyProgress } from "@/components/MonthlyProgress";
import { SettingsSheet } from "@/components/SettingsSheet";
import { getSettings, saveSettings, StorageCtx } from "@/lib/storage";

function Shell() {
  const { user, isGuest, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState(true);
  const [allowCustomTime, setAllowCustomTime] = useState(false);

  const ctx: StorageCtx = useMemo(() => ({ userId: user?.id ?? null }), [user?.id]);
  const signedIn = !!user || isGuest;

  useEffect(() => {
    if (signedIn) getSettings(ctx).then((settings) => {
      setWizardMode(settings.wizardMode);
      setAllowCustomTime(settings.allowCustomTime);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, ctx.userId]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Opening…</div>;
  }
  if (!signedIn) return <AuthScreen />;

  const view: View = location.pathname.startsWith("/weekly")
    ? "weekly"
    : location.pathname.startsWith("/monthly")
      ? "monthly"
      : "daily";

  const onWizardModeChange = (v: boolean) => {
    setWizardMode(v);
    saveSettings(ctx, { wizardMode: v, allowCustomTime });
  };

  const onAllowCustomTimeChange = (v: boolean) => {
    setAllowCustomTime(v);
    saveSettings(ctx, { wizardMode, allowCustomTime: v });
  };

  return (
    <div className="soft-gradient-bg min-h-screen">
      <Header view={view} onViewChange={(v) => navigate(v === "daily" ? "/" : `/${v}`)}
        onOpenSettings={() => setSettingsOpen(true)} />
      <main className="safe-bottom-padding mx-auto max-w-lg px-4 py-5">
        <Routes>
          <Route path="/" element={<DailyView ctx={ctx} wizardMode={wizardMode} allowCustomTime={allowCustomTime} />} />
          <Route path="/weekly" element={<WeeklyView ctx={ctx} />} />
          <Route path="/monthly" element={<MonthlyProgress ctx={ctx}
            onOpenDate={(date) => navigate(`/?date=${date}`)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}
        wizardMode={wizardMode} onWizardModeChange={onWizardModeChange}
        allowCustomTime={allowCustomTime} onAllowCustomTimeChange={onAllowCustomTimeChange} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

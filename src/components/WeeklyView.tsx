import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, FileDown, Check } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  DailyEntry, DAY_KEYS, ATTENDANCE_ITEMS, STUDY_ITEMS, compareWeeks,
} from "@/lib/sadhana-types";
import { getEntriesForWeek, entriesByDay, StorageCtx } from "@/lib/storage";
import { pramanasForComparison } from "@/lib/pramanas";

import { cn } from "@/lib/utils";

function PercentCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-secondary p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold">{Math.round(value)}%</div>
    </div>
  );
}

export function WeeklyView({ ctx }: { ctx: StorageCtx }) {
  const { isGuest, user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [tab, setTab] = useState<"log" | "report">("log");
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [lastEntries, setLastEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [devoteeName, setDevoteeName] = useState(() => localStorage.getItem("sadhana:name") ?? "");
  const [mentorName, setMentorName] = useState(() => localStorage.getItem("sadhana:mentor") ?? "");

  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getEntriesForWeek(ctx, weekStartStr),
      getEntriesForWeek(ctx, format(addWeeks(weekStart, -1), "yyyy-MM-dd")),
    ])
      .then(([cur, prev]) => {
        if (cancelled) return;
        setEntries(cur);
        setLastEntries(prev);
      })
      .catch(() => toast.error("Couldn't load this week's entries; please try again. Hare Krishna 🙏"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartStr, ctx.userId]);

  const byDay = useMemo(() => entriesByDay(entries), [entries]);
  const comparison = useMemo(() => compareWeeks(entries, lastEntries), [entries, lastEntries]);
  const { thisWeek, lastWeek } = comparison;

  const overallPct =
    ((thisWeek.wakeTotal + thisWeek.japaTotal + thisWeek.bedTotal) / (175 * 3)) * 100;

  const doExport = async () => {
    localStorage.setItem("sadhana:name", devoteeName);
    localStorage.setItem("sadhana:mentor", mentorName);
    setExporting(true);
    try {
      const { exportSadhanaCard } = await import("@/lib/exportSadhanaCard");
      await exportSadhanaCard({
        name: devoteeName || (user?.email ?? (isGuest ? "Guest devotee" : "")),
        mentor: mentorName,
        dateFrom: format(weekStart, "dd/MM/yyyy"),
        dateTo: format(addDays(weekStart, 6), "dd/MM/yyyy"),
        days: byDay,
      });
      toast.success("Your sadhana card is ready to share with your mentor. Hare Krishna 🙏");
    } catch {
      toast.error("The card export didn't complete; please try again. Hare Krishna 🙏");
    } finally {
      setExporting(false);
    }
  };

  const scoreChart = DAY_KEYS.flatMap((d) => []).length; // noop to satisfy nothing
  void scoreChart;

  const compareData = [
    { name: "Wake", "This week": thisWeek.wakeTotal, "Last week": lastWeek.wakeTotal },
    { name: "Japa", "This week": thisWeek.japaTotal, "Last week": lastWeek.japaTotal },
    { name: "Bed", "This week": thisWeek.bedTotal, "Last week": lastWeek.bedTotal },
  ];
  const minutesData = [
    { name: "Reading", "This week": thisWeek.readingMinutes, "Last week": lastWeek.readingMinutes },
    { name: "SP lect.", "This week": thisWeek.spLectureMinutes, "Last week": lastWeek.spLectureMinutes },
    { name: "GM lect.", "This week": thisWeek.gmLectureMinutes, "Last week": lastWeek.gmLectureMinutes },
    { name: "RSP lect.", "This week": thisWeek.rspLectureMinutes, "Last week": lastWeek.rspLectureMinutes },
    { name: "Mangala (days)", "This week": thisWeek.morningProgramDays, "Last week": lastWeek.morningProgramDays },
  ];

  return (
    <div className="space-y-4">
      {/* week navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous week"
          onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-xl font-semibold">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </div>
          <div className="text-xs text-muted-foreground">Sunday to Saturday</div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Next week"
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* sub-tabs */}
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Weekly sections">
        {(["log", "report"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn(
              "rounded-md py-2 text-sm font-medium capitalize",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Loading the week…</CardContent></Card>
      ) : tab === "log" ? (
        <>
          <Card>
            <CardContent className="overflow-x-auto p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="p-1 text-left font-medium">Item</th>
                    {DAY_KEYS.map((d) => <th key={d} className="p-1 font-medium">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-1">Wake</td>{DAY_KEYS.map((d) => (
                    <td key={d} className="p-1 text-center">{byDay[d]?.wakeUpTime ?? "·"}</td>))}</tr>
                  <tr><td className="p-1">Japa</td>{DAY_KEYS.map((d) => (
                    <td key={d} className="p-1 text-center">{byDay[d]?.japaCompletionTime ?? "·"}</td>))}</tr>
                  <tr><td className="p-1">Bed</td>{DAY_KEYS.map((d) => (
                    <td key={d} className="p-1 text-center">{byDay[d]?.bedTime ?? "·"}</td>))}</tr>
                  <tr><td className="p-1">Rounds</td>{DAY_KEYS.map((d) => (
                    <td key={d} className="p-1 text-center">{byDay[d]?.japaRounds ?? "·"}</td>))}</tr>
                  {ATTENDANCE_ITEMS.map(({ key, label }) => (
                    <tr key={key as string}>
                      <td className="p-1">{label.replace(/\s*\(.*\)/, "")}</td>
                      {DAY_KEYS.map((d) => (
                        <td key={d} className="p-1 text-center">
                          {byDay[d]?.[key] ? <Check className="mx-auto h-3.5 w-3.5 text-success" /> : "·"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {STUDY_ITEMS.map(({ key, label }) => (
                    <tr key={key as string}>
                      <td className="p-1">{label} (min)</td>
                      {DAY_KEYS.map((d) => (
                        <td key={d} className="p-1 text-center">{(byDay[d]?.[key] as number) || "·"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <PercentCard label="Wake-up" value={(thisWeek.wakeTotal / 175) * 100} />
            <PercentCard label="Japa" value={(thisWeek.japaTotal / 175) * 100} />
            <PercentCard label="Bed-time" value={(thisWeek.bedTotal / 175) * 100} />
            <PercentCard label="Overall" value={overallPct} />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xl">Export to Sadhana Card</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Fills the official Brahmacari Sadhana Card with this week's entries: scores circled,
                attendance ticked, totals and percentages computed.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Your name" value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)} aria-label="Your name" />
                <Input placeholder="Mentor" value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)} aria-label="Mentor" />
              </div>
              <Button className="w-full" onClick={doExport} disabled={exporting || entries.length === 0}>
                <FileDown className="h-4 w-4" />
                {exporting ? "Preparing card…" : "Export week to card (PDF)"}
              </Button>
              {entries.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Log at least one day this week to export.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xl">Scores: this week vs last</CardTitle></CardHeader>
            <CardContent className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(38 22% 86%)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} domain={[0, 175]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="This week" fill="hsl(82 22% 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Last week" fill="hsl(38 22% 78%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xl">Hearing, reading, attendance</CardTitle></CardHeader>
            <CardContent className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={minutesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(38 22% 86%)" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={88} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="This week" fill="hsl(82 22% 55%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Last week" fill="hsl(38 22% 78%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {pramanasForComparison(comparison).map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-2 p-5">
                  <p className="font-display text-lg italic leading-snug">"{p.text}"</p>
                  <p className="text-xs font-medium text-muted-foreground">{p.reference}</p>
                  <p className="text-sm">{p.encouragement}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

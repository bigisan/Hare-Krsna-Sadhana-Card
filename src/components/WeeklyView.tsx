import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, FileDown, Check, FileText, Share2, ShieldCheck } from "lucide-react";
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
import {
  canSharePdf,
  downloadPdf,
  openPdf,
  sharePdf,
  type SadhanaCardPdf,
} from "@/lib/pdfDelivery";

import { cn } from "@/lib/utils";

function PercentCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-control rounded-2xl p-3 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{Math.round(value)}%</div>
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
  const [preparedPdf, setPreparedPdf] = useState<SadhanaCardPdf | null>(null);
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
      const pdf = await exportSadhanaCard({
        name: devoteeName || (user?.email ?? (isGuest ? "Guest devotee" : "")),
        mentor: mentorName,
        dateFrom: format(weekStart, "dd/MM/yyyy"),
        dateTo: format(addDays(weekStart, 6), "dd/MM/yyyy"),
        days: byDay,
      });
      setPreparedPdf(pdf);

      if (canSharePdf(pdf)) {
        try {
          await sharePdf(pdf);
          toast.success("Your sadhana card is ready to share with your mentor. Hare Krishna 🙏");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          toast.info("Your PDF is ready. Tap Share or save PDF below.");
          return;
        }
      }

      downloadPdf(pdf);
      toast.success("Your sadhana card PDF has been downloaded. Hare Krishna 🙏");
    } catch {
      toast.error("The card export didn't complete; please try again. Hare Krishna 🙏");
    } finally {
      setExporting(false);
    }
  };

  const sharePreparedPdf = async () => {
    if (!preparedPdf) return;

    try {
      if (canSharePdf(preparedPdf)) {
        await sharePdf(preparedPdf);
      } else {
        openPdf(preparedPdf);
        toast.info("The PDF is open. Use your browser's Share button to save it to Files.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("The PDF couldn't open. Please try again.");
      }
    }
  };

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
      <div className="glass-control flex items-center justify-between rounded-2xl p-2">
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
      <div className="glass-control grid grid-cols-2 gap-1 rounded-2xl p-1" role="tablist" aria-label="Weekly sections">
        {(["log", "report"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn(
              "pressable min-h-10 rounded-xl py-2 text-sm font-semibold capitalize",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t ? "bg-primary text-primary-foreground shadow-[0_10px_20px_hsl(82_24%_24%_/_0.20)]" : "text-secondary-foreground hover:bg-card/70",
            )}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="rounded-3xl"><CardContent className="py-10 text-center text-muted-foreground">Loading the week…</CardContent></Card>
      ) : tab === "log" ? (
        <>
          <Card className="rounded-3xl">
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

          <Card className="overflow-hidden rounded-3xl border-primary/25 bg-[linear-gradient(145deg,hsl(82_22%_31%),hsl(35_28%_18%))] text-primary-foreground shadow-lift">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-semibold text-white/85">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    PDF export
                  </div>
                  <h3 className="mt-3 font-display text-3xl font-semibold leading-none">Official card, ready to share</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/72">
                    Fills the Brahmacari Sadhana Card with this week&apos;s scores, attendance, totals, and percentages.
                  </p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/12">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Your name" value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)} aria-label="Your name"
                  className="border-white/20 bg-white/12 text-white placeholder:text-white/55 focus-visible:ring-white/45" />
                <Input placeholder="Mentor" value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)} aria-label="Mentor"
                  className="border-white/20 bg-white/12 text-white placeholder:text-white/55 focus-visible:ring-white/45" />
              </div>
              <Button className="w-full bg-white text-foreground shadow-[0_12px_28px_hsl(0_0%_0%_/_0.20)] hover:bg-white/92" onClick={doExport} disabled={exporting || entries.length === 0}>
                <FileDown className="h-4 w-4" />
                {exporting ? "Preparing card…" : "Export week to card (PDF)"}
              </Button>
              {preparedPdf && (
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="mb-2 text-center text-xs font-medium text-white/80">Your PDF is ready.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full border-white/20 bg-white/90 text-foreground hover:bg-white"
                    onClick={sharePreparedPdf}
                  >
                    <Share2 className="h-4 w-4" />
                    Share or save PDF
                  </Button>
                </div>
              )}
              {entries.length === 0 && (
                <p className="text-center text-xs text-white/62">
                  Log at least one day this week to export.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="rounded-3xl">
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
          <Card className="rounded-3xl">
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
              <Card key={p.id} className="rounded-3xl">
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

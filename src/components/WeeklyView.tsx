import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, FileDown, Check, FileText, Share2 } from "lucide-react";
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
import { startOfSadhanaWeek } from "@/lib/date-utils";
import { formatTimingDisplay } from "@/lib/time-display";

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 px-2 py-2 text-center">
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function WeeklyView({ ctx }: { ctx: StorageCtx }) {
  const { isGuest, user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfSadhanaWeek(new Date()));
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

  const coreTotal = thisWeek.wakeTotal + thisWeek.japaTotal + thisWeek.bedTotal;
  const overallPct = Math.max(0, Math.min(100, (coreTotal / 525) * 100));
  const roundsTotal = entries.reduce((total, entry) => total + entry.japaRounds, 0);
  const hearingTotal = thisWeek.spLectureMinutes + thisWeek.gmLectureMinutes + thisWeek.rspLectureMinutes;

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

      // iOS usually completes export in two taps: prepare the file, then invoke the
      // native Share sheet. Keeping the prepared PDF also gives users a reliable retry.
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
    <div className="space-y-3">
      {/* week navigator */}
      <div className="flex items-center justify-between px-1 py-1">
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
      <div className="quiet-surface grid grid-cols-2 gap-1 rounded-xl p-1" role="tablist" aria-label="Weekly sections">
        {(["log", "report"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn(
              "pressable min-h-10 rounded-xl py-2 text-sm font-semibold capitalize",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t ? "bg-primary text-primary-foreground shadow-soft" : "text-secondary-foreground hover:bg-card",
            )}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="rounded-3xl"><CardContent className="py-10 text-center text-muted-foreground">Loading the week…</CardContent></Card>
      ) : tab === "log" ? (
        <>
          <section className="quiet-surface overflow-hidden rounded-2xl" aria-labelledby="weekly-status">
            <div className="px-4 pb-3 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Weekly status</p>
                  <h2 id="weekly-status" className="mt-1 font-display text-2xl font-semibold leading-none">
                    {thisWeek.daysLogged ? "A steady week is forming." : "Begin this week's card."}
                  </h2>
                </div>
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                  {Math.round(overallPct)}%
                </span>
              </div>
            </div>
            <div className="flex divide-x divide-border/70 border-y border-border/55 px-2 py-1">
              <SummaryStat label="Submitted" value={`${thisWeek.daysLogged}/7`} />
              <SummaryStat label="Core score" value={`${coreTotal}/525`} />
              <SummaryStat label="Rounds" value={String(roundsTotal)} />
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center">
              <div><p className="text-[11px] text-muted-foreground">Mangala Arati</p><p className="font-semibold">{thisWeek.morningProgramDays} days</p></div>
              <div><p className="text-[11px] text-muted-foreground">Reading</p><p className="font-semibold">{thisWeek.readingMinutes} min</p></div>
              <div><p className="text-[11px] text-muted-foreground">Hearing</p><p className="font-semibold">{hearingTotal} min</p></div>
            </div>
          </section>

          <section className="quiet-surface rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/[0.12] text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold leading-none">Official Sadhana Card PDF</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Prepare the ISKCON Sydney card for this week.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Input placeholder="Your name" value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)} aria-label="Your name" />
                <Input placeholder="Mentor" value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)} aria-label="Mentor" />
              </div>
              <Button className="mt-3 w-full" onClick={doExport} disabled={exporting || entries.length === 0}>
                <FileDown className="h-4 w-4" />
                {exporting ? "Preparing PDF…" : "Prepare PDF"}
              </Button>
              {preparedPdf && (
                <div className="mt-3 rounded-xl border border-success/25 bg-success/10 p-3">
                  <p className="mb-2 text-center text-xs font-medium text-success">Your PDF is ready.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={sharePreparedPdf}
                  >
                    <Share2 className="h-4 w-4" />
                    Share or Save PDF
                  </Button>
                </div>
              )}
              {entries.length === 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Log at least one day this week to export.
                </p>
              )}
              {isGuest && (
                <p className="mt-3 rounded-xl bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Your entries are saved on this device. Back up regularly or sign in to sync.
                </p>
              )}
          </section>

          <section aria-labelledby="week-days">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 id="week-days" className="text-sm font-semibold">Sunday to Saturday</h2>
              <span className="text-xs text-muted-foreground">Swipe to review</span>
            </div>
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DAY_KEYS.map((day, index) => {
                const entry = byDay[day];
                const date = addDays(weekStart, index);
                const score = entry ? entry.wakeUpScore + entry.japaScore + entry.bedTimeScore : 0;
                return (
                  <article key={day} className="quiet-surface w-[10.75rem] shrink-0 snap-start rounded-2xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-primary">{format(date, "EEE")}</p>
                        <p className="text-sm font-semibold">{format(date, "d MMM")}</p>
                      </div>
                      <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", entry ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground")}>
                        {entry ? `${score}/75` : "Open"}
                      </span>
                    </div>
                    {entry ? (
                      <div className="mt-3 space-y-2 text-xs">
                        <p><span className="block text-[10px] text-muted-foreground">Wake</span><span className="block font-medium leading-tight">{formatTimingDisplay("wake", entry.wakeUpTime, entry.wakeUpScore)}</span></p>
                        <p><span className="block text-[10px] text-muted-foreground">Japa</span><span className="block font-medium leading-tight">{entry.japaRounds} rounds</span></p>
                        <p><span className="block text-[10px] text-muted-foreground">Sleep</span><span className="block font-medium leading-tight">{formatTimingDisplay("sleep", entry.bedTime, entry.bedTimeScore)}</span></p>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">No submitted card for this day.</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <details className="group quiet-surface overflow-hidden rounded-2xl">
            <summary className="pressable flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Full weekly log
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="overflow-x-auto border-t border-border/55">
              <table className="w-full min-w-[760px] text-[11px]">
                <thead className="bg-secondary/45 text-muted-foreground">
                  <tr><th className="sticky left-0 z-10 w-36 bg-secondary p-2 text-left">Item</th>{DAY_KEYS.map((day) => <th key={day} className="p-2">{day}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {([
                    ["Wake", (entry: DailyEntry) => formatTimingDisplay("wake", entry.wakeUpTime, entry.wakeUpScore)],
                    ["Japa", (entry: DailyEntry) => formatTimingDisplay("japa", entry.japaCompletionTime, entry.japaScore)],
                    ["Sleep", (entry: DailyEntry) => formatTimingDisplay("sleep", entry.bedTime, entry.bedTimeScore)],
                    ["Rounds", (entry: DailyEntry) => String(entry.japaRounds)],
                  ] as Array<[string, (entry: DailyEntry) => string]>).map(([label, value]) => (
                    <tr key={label}><td className="sticky left-0 bg-card p-2 font-semibold">{label}</td>{DAY_KEYS.map((day) => <td key={day} className="p-2 text-center">{byDay[day] ? value(byDay[day]!) : "·"}</td>)}</tr>
                  ))}
                  {ATTENDANCE_ITEMS.map(({ key, label }) => (
                    <tr key={key as string}><td className="sticky left-0 bg-card p-2 font-medium">{label.replace(/\s*\(.*\)/, "")}</td>{DAY_KEYS.map((day) => <td key={day} className="p-2 text-center">{byDay[day]?.[key] ? <Check className="mx-auto h-3.5 w-3.5 text-success" /> : "·"}</td>)}</tr>
                  ))}
                  {STUDY_ITEMS.map(({ key, label }) => (
                    <tr key={key as string}><td className="sticky left-0 bg-card p-2 font-medium">{label} (min)</td>{DAY_KEYS.map((day) => <td key={day} className="p-2 text-center">{(byDay[day]?.[key] as number) || "·"}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <>
          <Card className="rounded-2xl">
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
          <Card className="rounded-2xl">
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
              <Card key={p.id} className="rounded-2xl">
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

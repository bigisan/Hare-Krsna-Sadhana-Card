// Exports a week onto the official Brahmacari Sadhana Card (PDF overlay).
// Fully client-side via pdf-lib, so it works for authed and guest users.
// Template: /public/sadhana-card-template.pdf (the original card, annotations stripped).

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { DailyEntry } from "./sadhana-types";
import type { SadhanaCardPdf } from "./pdfDelivery";

const PAGE_H = 842;
const INK = rgb(0.11, 0.31, 0.85); // pen blue

// Coordinate map measured from the original card (top-left origin).
const DAY_CX: Record<string, number> = {
  SUN: 261.8, MON: 299.1, TUE: 336.2, WED: 372.9, THU: 409.3, FRI: 445.5, SAT: 482.2,
};
const TOTAL_CX = 522.0;
const BLOCK_TOP = { bed: 149.3, wake: 205.3, japa: 262.0 } as const; // y of the "25" row
const SCORE_STEP = 9.2;
const SCORE_ROW: Record<number, number> = { 25: 0, 20: 1, 15: 2, 10: 3, 5: 4, 0: 5, [-5]: 5 };
const BLOCK_TOTAL_Y = { bed: 172, wake: 228, japa: 285 } as const;

const ATT_Y: Record<string, number> = {
  mangalaArati: 318.8, tulasiArati: 331.3, darshanArati: 343.8, guruPuja: 356.3,
  bhagavatamClass: 368.8, deityDarshan: 381.3, slokaMemorisation: 393.8, yoga: 406.3,
  bookDistribution: 418.8, bdHours: 431.3, instrumentPractice: 443.8, gauraArati: 456.3,
};

const MIN_CX: Record<string, number> = {
  SUN: 265.8, MON: 302.9, TUE: 339.7, WED: 375.6, THU: 412.8, FRI: 447.5, SAT: 481.4,
};
const MIN_TOTAL_CX = 520.4;
const MIN_Y: Record<string, number> = {
  spBooksMinutes: 712.6, spLecturesMinutes: 729.1,
  guruMaharajaMinutes: 747.4, rspLecturesMinutes: 765.1,
};

const y = (top: number) => PAGE_H - top;

export interface WeekExport {
  name: string;
  mentor: string;
  dateFrom: string; // dd/MM/yyyy
  dateTo: string;
  days: Partial<Record<string, DailyEntry>>; // keyed SUN..SAT
}

export async function exportSadhanaCard(week: WeekExport): Promise<SadhanaCardPdf> {
  const templateBytes = await fetch("/sadhana-card-template.pdf").then((r) => {
    if (!r.ok) throw new Error("Card template not found in /public");
    return r.arrayBuffer();
  });
  const doc = await PDFDocument.load(templateBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const zapf = await doc.embedFont(StandardFonts.ZapfDingbats); // ✓ glyph
  const page = doc.getPage(0);

  const textC = (cx: number, top: number, s: string, size = 8, f = font) => {
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: cx - w / 2, y: y(top) - size * 0.35, size, font: f, color: INK });
  };
  const textL = (x: number, top: number, s: string, size = 10) =>
    page.drawText(s, { x, y: y(top), size, font, color: INK });

  textL(98, 31, week.name);
  textL(345, 31, week.mentor);
  textL(128, 57, week.dateFrom);
  textL(322, 57, week.dateTo);

  const totals = { bed: 0, wake: 0, japa: 0 };
  const attCount: Record<string, number> = {};
  const minTotals: Record<string, number> = {};
  let bdTotal = 0;

  for (const [day, e] of Object.entries(week.days)) {
    if (!e || !(day in DAY_CX)) continue;
    const cx = DAY_CX[day];

    const blocks: Array<[keyof typeof BLOCK_TOP, number]> = [
      ["bed", e.bedTimeScore], ["wake", e.wakeUpScore], ["japa", e.japaScore],
    ];
    for (const [block, score] of blocks) {
      totals[block] += score;
      const rowTop = BLOCK_TOP[block] + (SCORE_ROW[score] ?? 5) * SCORE_STEP;
      page.drawEllipse({ x: cx, y: y(rowTop), xScale: 7, yScale: 4.5, borderColor: INK, borderWidth: 0.9 });
      if (score === -5) textC(cx + 13, rowTop, "-5", 6);
    }

    for (const [key, top] of Object.entries(ATT_Y)) {
      if (key === "bdHours") {
        if (e.bdHours) { textC(cx, top, String(e.bdHours)); bdTotal += e.bdHours; }
      } else if (e[key as keyof DailyEntry]) {
        textC(cx, top, "4", 8, zapf); // "4" is the check mark in ZapfDingbats
        attCount[key] = (attCount[key] ?? 0) + 1;
      }
    }

    for (const [key, top] of Object.entries(MIN_Y)) {
      const v = (e[key as keyof DailyEntry] as number) ?? 0;
      textC(MIN_CX[day], top, String(v));
      minTotals[key] = (minTotals[key] ?? 0) + v;
    }
  }

  for (const block of ["bed", "wake", "japa"] as const) {
    textC(TOTAL_CX, BLOCK_TOTAL_Y[block] - 6, String(totals[block]), 9, bold);
    textC(TOTAL_CX, BLOCK_TOTAL_Y[block] + 6, `${Math.round((totals[block] / 175) * 100)}%`);
  }

  for (const [key, top] of Object.entries(ATT_Y)) {
    if (key === "bdHours") { if (bdTotal) textC(TOTAL_CX, top, String(bdTotal)); }
    else if (attCount[key]) textC(TOTAL_CX, top, String(attCount[key]));
  }

  for (const [key, top] of Object.entries(MIN_Y)) {
    textC(MIN_TOTAL_CX, top, String(minTotals[key] ?? 0));
  }

  const spHours = ((minTotals.spBooksMinutes ?? 0) / 60).toFixed(1);
  textC(380, 501, spHours, 9);
  textC(415, 629, String(minTotals.guruMaharajaMinutes ?? 0), 9);
  textC(415, 648, String(minTotals.spLecturesMinutes ?? 0), 9);
  textC(415, 666, String(minTotals.rspLecturesMinutes ?? 0), 9);

  const bytes = await doc.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  return {
    blob,
    fileName: `sadhana-card-${week.dateFrom.replaceAll("/", "-")}.pdf`,
  };
}

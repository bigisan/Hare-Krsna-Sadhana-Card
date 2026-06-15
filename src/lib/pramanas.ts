import type { WeekComparison } from "./sadhana-types";

export interface Pramana {
  id: string;
  category: "reading" | "hearing" | "morning-program" | "regularity" | "appreciation";
  reference: string;
  text: string;
  encouragement: string;
}

export const PRAMANAS: Pramana[] = [
  {
    id: "reading-1",
    category: "reading",
    reference: "Srimad Bhagavatam 1.1.2",
    text: "Simply by hearing this Bhagavata Purana, the Supreme Lord is captured within the heart.",
    encouragement:
      "Even a few extra minutes with Srila Prabhupada's books each day plants seeds that grow for lifetimes. Tomorrow morning is a fresh page. Hare Krishna 🙏",
  },
  {
    id: "reading-2",
    category: "reading",
    reference: "Srila Prabhupada, letter to Bhargava, 13 June 1972",
    text: "Srila Prabhupada asked his disciples to read his books daily with great care, promising that all questions would be answered there.",
    encouragement:
      "Reading is the quiet feast of the soul. A gentle goal: one chapter with your morning prasadam. Hare Krishna 🙏",
  },
  {
    id: "hearing-1",
    category: "hearing",
    reference: "Srimad Bhagavatam 1.2.17",
    text: "Sri Krishna, who is the Paramatma in everyone's heart, cleanses desire for material enjoyment from the heart of the devotee who relishes His messages.",
    encouragement:
      "Hearing is the easiest limb of bhakti; even while walking or cooking, a lecture can flow into the ear and the heart. Hare Krishna 🙏",
  },
  {
    id: "morning-1",
    category: "morning-program",
    reference: "Srila Prabhupada on Mangala Arati",
    text: "Srila Prabhupada called the morning program the most important engagement of the day, the time when Krishna's mercy is most freely given.",
    encouragement:
      "The Deities are waiting to see you at Mangala Arati. One early night tonight makes tomorrow's darshan effortless. Hare Krishna 🙏",
  },
  {
    id: "regularity-1",
    category: "regularity",
    reference: "Bhagavad-gita 6.16-17",
    text: "He who is regulated in his habits of eating, sleeping, recreation and work can mitigate all material pains by practicing the yoga system.",
    encouragement:
      "Regulation is not restriction; it is the riverbank that lets the river of bhakti flow with force. Small, steady steps. Hare Krishna 🙏",
  },
  {
    id: "appreciation-1",
    category: "appreciation",
    reference: "From your weekly progress",
    text: "Srila Prabhupada, Guru Maharaj, and Sri Sri Radha Gopinath are pleased by your steady, sincere effort.",
    encouragement:
      "Your consistency this week is itself an offering. Keep this gentle momentum. Hare Krishna 🙏",
  },
];

export function pramanasForComparison(c: WeekComparison): Pramana[] {
  const out: Pramana[] = [];
  if (c.lowReading) out.push(...PRAMANAS.filter((p) => p.category === "reading"));
  if (c.lowHearing) out.push(...PRAMANAS.filter((p) => p.category === "hearing"));
  if (c.missedMorningProgram) out.push(...PRAMANAS.filter((p) => p.category === "morning-program"));
  if (c.irregularSleep) out.push(...PRAMANAS.filter((p) => p.category === "regularity"));
  if (c.improving || out.length === 0)
    out.push(...PRAMANAS.filter((p) => p.category === "appreciation"));
  return out;
}

/** One pramana for the Daily MotivationBanner when recent days regress. */
export function bannerPramana(c: WeekComparison): Pramana | null {
  const list = pramanasForComparison(c).filter((p) => p.category !== "appreciation");
  return list.length ? list[0] : null;
}

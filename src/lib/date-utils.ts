import { addDays, format, startOfWeek } from "date-fns";

export function startOfSadhanaWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

export function sadhanaWeekBounds(date: Date): { start: string; end: string } {
  const startDate = startOfSadhanaWeek(date);
  return {
    start: format(startDate, "yyyy-MM-dd"),
    end: format(addDays(startDate, 6), "yyyy-MM-dd"),
  };
}

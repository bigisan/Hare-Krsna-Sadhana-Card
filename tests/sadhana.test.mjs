import test from "node:test";
import assert from "node:assert/strict";
import { scoreBedTime, scoreJapa, scoreWakeUp } from "../src/lib/sadhana-types.ts";
import { sadhanaWeekBounds } from "../src/lib/date-utils.ts";
import { formatTimingDisplay } from "../src/lib/time-display.ts";

test("wake scoring follows every threshold", () => {
  assert.deepEqual(
    ["03:45", "04:00", "04:15", "04:30", "04:45", "05:00", "05:01"].map(scoreWakeUp),
    [25, 20, 15, 10, 5, 0, -5],
  );
});

test("japa remains zero from 10:00 through 10:15", () => {
  assert.deepEqual(
    ["07:15", "09:00", "09:15", "09:30", "09:45"].map(scoreJapa),
    [25, 20, 15, 10, 5],
  );
  assert.equal(scoreJapa("10:00"), 0);
  assert.equal(scoreJapa("10:15"), 0);
  assert.equal(scoreJapa("10:16"), -5);
});

test("sleep scoring includes after-midnight times as late", () => {
  assert.deepEqual(
    ["20:45", "21:00", "21:15", "21:30", "21:45", "22:00", "22:01", "00:30"].map(scoreBedTime),
    [25, 20, 15, 10, 5, 0, -5, -5],
  );
});

test("sadhana weeks run Sunday through Saturday", () => {
  assert.deepEqual(sadhanaWeekBounds(new Date(2026, 5, 17)), {
    start: "2026-06-14",
    end: "2026-06-20",
  });
});

test("representative times display as timing brackets", () => {
  assert.equal(formatTimingDisplay("wake", "05:01", -5), "after 5:00 am");
  assert.equal(formatTimingDisplay("japa", "10:15", 0), "10:00 - 10:15 am");
  assert.equal(formatTimingDisplay("japa", "10:16", -5), "after 10:15 am");
  assert.equal(formatTimingDisplay("sleep", "22:01", -5), "after 10:00 pm");
  assert.equal(formatTimingDisplay("wake", "04:07", 15), "4:07 am");
});

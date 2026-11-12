import assert from "node:assert/strict";
import test from "node:test";

import { formatReviewTimestamp } from "../src/lib/review-time.ts";

test("review dates use the full month without a time in winter and summer", () => {
  assert.equal(formatReviewTimestamp("2026-01-15T20:30:00.000Z"), "January 15, 2026");
  assert.equal(formatReviewTimestamp("2026-07-15T19:30:00.000Z"), "July 15, 2026");
});

test("review dates follow the spring daylight saving transition", () => {
  assert.equal(formatReviewTimestamp("2026-03-08T07:30:00.000Z"), "March 7, 2026");
  assert.equal(formatReviewTimestamp("2026-03-09T07:30:00.000Z"), "March 9, 2026");
});

test("review dates use the Cupertino calendar day across UTC midnight", () => {
  assert.equal(formatReviewTimestamp("2026-11-09T03:30:00.000Z"), "November 8, 2026");
});

test("missing or invalid review timestamps have no label", () => {
  assert.equal(formatReviewTimestamp(null), null);
  assert.equal(formatReviewTimestamp("invalid"), null);
});

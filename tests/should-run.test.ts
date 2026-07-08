import assert from "node:assert/strict";
import test from "node:test";

import { ReviewFrequency } from "../src/generated/prisma/client";
import { shouldRunPricingCycle } from "../src/server/scheduler/should-run";

const now = new Date("2026-07-05T12:00:00.000Z");

test("runs when there is no previous run", () => {
  assert.equal(
    shouldRunPricingCycle({
      lastRunAt: null,
      reviewFrequency: ReviewFrequency.DAILY,
      now,
    }),
    true,
  );
});

test("prevents an hourly run before one hour has passed", () => {
  assert.equal(
    shouldRunPricingCycle({
      lastRunAt: new Date("2026-07-05T11:30:00.000Z"),
      reviewFrequency: ReviewFrequency.HOURLY,
      now,
    }),
    false,
  );
});

test("allows a daily run after twenty four hours", () => {
  assert.equal(
    shouldRunPricingCycle({
      lastRunAt: new Date("2026-07-04T12:00:00.000Z"),
      reviewFrequency: ReviewFrequency.DAILY,
      now,
    }),
    true,
  );
});

test("prevents a weekly run before seven days", () => {
  assert.equal(
    shouldRunPricingCycle({
      lastRunAt: new Date("2026-07-01T12:00:00.000Z"),
      reviewFrequency: ReviewFrequency.WEEKLY,
      now,
    }),
    false,
  );
});

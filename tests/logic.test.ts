import { test } from "node:test";
import assert from "node:assert/strict";
import { MOCK_PROFILES } from "../src/mockData";
import { localMatches, houseOf, sharesSkill } from "../src/utils/matching";
import {
  assertTransition,
  completionUpdates,
  validateBooking,
  escapeIcs,
} from "../src/utils/lessonRules";
import * as store from "../src/utils/demoStore";
import type { SwapRequest } from "../src/types";
const learner = { ...MOCK_PROFILES[0] },
  teacher = { ...MOCK_PROFILES[2] };
const swap: SwapRequest = {
  id: "lesson",
  requesterId: learner.id,
  requesterName: learner.displayName,
  receiverId: teacher.id,
  receiverName: teacher.displayName,
  skill: teacher.skills[0],
  duration: 1,
  credits: 1,
  status: "accepted",
  dateTime: "2020-01-01T12:00:00Z",
  notes: "",
  createdAt: "2020-01-01T10:00:00Z",
};
test("matching excludes self and prioritizes mutual skill exchanges", () => {
  const matches = localMatches(learner, MOCK_PROFILES);
  assert.equal(matches[0].user.id, teacher.id);
  assert.ok(
    matches.every(
      (x) => x.user.id !== learner.id && x.compatibilityScore <= 100,
    ),
  );
});
test("skills ignore casing and whitespace", () =>
  assert.deepEqual(sharesSkill([" Charms "], ["charms"]), [" Charms "]));
test("house inference handles library and greenhouse locations", () => {
  assert.equal(houseOf(MOCK_PROFILES[1]), "Gryffindor");
  assert.equal(houseOf(MOCK_PROFILES[4]), "Gryffindor");
});
test("booking rejects self, unsupported subjects, past times, invalid duration and insufficient credits", () => {
  const time = "2099-01-01T10:00:00Z";
  assert.throws(() =>
    validateBooking(learner, learner, learner.skills[0], 1, time),
  );
  assert.throws(() => validateBooking(learner, teacher, "Fake", 1, time));
  assert.throws(() =>
    validateBooking(learner, teacher, teacher.skills[0], 1, "2020-01-01"),
  );
  assert.throws(() =>
    validateBooking(learner, teacher, teacher.skills[0], -1, time),
  );
  assert.throws(() =>
    validateBooking(
      { ...learner, credits: 0 },
      teacher,
      teacher.skills[0],
      1,
      time,
    ),
  );
  assert.doesNotThrow(() =>
    validateBooking(learner, teacher, teacher.skills[0], 1, time),
  );
});
test("status changes only allow correct actor and source state", () => {
  const pending = {
    ...swap,
    status: "pending" as const,
    dateTime: "2099-01-01T10:00:00Z",
  };
  assert.doesNotThrow(() => assertTransition(pending, teacher.id, "accepted"));
  assert.throws(() => assertTransition(pending, learner.id, "accepted"));
  assert.throws(() => assertTransition(swap, teacher.id, "accepted"));
  assert.doesNotThrow(() => assertTransition(swap, learner.id, "cancelled"));
});
test("settlement conserves credits, records taught hours and weighted rating", () => {
  const x = completionUpdates(swap, learner.id, teacher, learner, 5, false);
  assert.equal(
    x.teacher.credits! + x.learner.credits!,
    teacher.credits + learner.credits,
  );
  assert.equal(x.teacher.taughtHours, teacher.taughtHours + 1);
  assert.equal(x.teacher.totalReviews, teacher.totalReviews + 1);
  assert.equal(
    x.teacher.rating,
    (teacher.rating * teacher.totalReviews + 5) / (teacher.totalReviews + 1),
  );
  assert.ok("learnerReviewed" in x.swap && x.swap.learnerReviewed);
});
test("second participant review does not transfer credits again", () => {
  const x = completionUpdates(
    { ...swap, status: "completed", learnerReviewed: true },
    teacher.id,
    teacher,
    learner,
    4,
    false,
  );
  assert.equal(x.teacher.credits, undefined);
  assert.equal(x.learner.credits, undefined);
  assert.equal(x.learner.totalReviews, learner.totalReviews + 1);
});
test("duplicate, premature, invalid and unaffordable reviews cannot settle", () => {
  assert.throws(() =>
    completionUpdates(swap, learner.id, teacher, learner, 5, true),
  );
  assert.throws(() =>
    completionUpdates(
      { ...swap, status: "pending" },
      learner.id,
      teacher,
      learner,
      5,
      false,
    ),
  );
  assert.throws(() =>
    completionUpdates(
      { ...swap, dateTime: "2099-01-01" },
      learner.id,
      teacher,
      learner,
      5,
      false,
    ),
  );
  assert.throws(() =>
    completionUpdates(swap, "outsider", teacher, learner, 5, false),
  );
  assert.throws(() =>
    completionUpdates(
      swap,
      learner.id,
      teacher,
      { ...learner, credits: 0 },
      5,
      false,
    ),
  );
  assert.throws(() =>
    completionUpdates(swap, learner.id, teacher, learner, 9, false),
  );
});
test("calendar content escapes newline and separator injection", () =>
  assert.equal(escapeIcs("Hello,\nWorld;\\"), "Hello\\,\\nWorld\\;\\\\"));
test("demo transactions serialize concurrent writes and roll back failures", async () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => values.get(k) || null,
      setItem: (k: string, v: string) => values.set(k, v),
    },
    configurable: true,
  });
  const ref = store.doc({}, "users", learner.id);
  const before = (await store.getDoc(ref)).data().credits;
  await Promise.all(
    Array.from({ length: 10 }, () =>
      store.runTransaction({}, async (tx: any) => {
        const snap = await tx.get(ref);
        tx.update(ref, { credits: snap.data().credits + 1 });
      }),
    ),
  );
  assert.equal((await store.getDoc(ref)).data().credits, before + 10);
  await assert.rejects(
    store.runTransaction({}, async (tx: any) => {
      tx.update(ref, { credits: 0 });
      throw new Error("rollback");
    }),
  );
  assert.equal((await store.getDoc(ref)).data().credits, before + 10);
});

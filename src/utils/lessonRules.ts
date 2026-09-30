import type { SwapRequest, UserProfile } from "../types";
export function assertTransition(
  swap: SwapRequest,
  actor: string,
  status: SwapRequest["status"],
) {
  const teacher = actor === swap.receiverId,
    learner = actor === swap.requesterId;
  if (!(
    (teacher &&
      swap.status === "pending" &&
      (status === "accepted" || status === "declined")) ||
    (learner &&
      (swap.status === "pending" || swap.status === "accepted") &&
      status === "cancelled")
  ))
    throw new Error("This lesson has changed. Refresh and try again.");
  if (status === "accepted" && new Date(swap.dateTime).getTime() <= Date.now())
    throw new Error(
      "This lesson time has passed. Please arrange a new lesson.",
    );
}
export function completionUpdates(
  swap: SwapRequest,
  actor: string,
  teacher: UserProfile,
  learner: UserProfile,
  rating: number,
  alreadyReviewed: boolean,
  now = Date.now(),
) {
  const isLearner = actor === swap.requesterId;
  if (!isLearner && actor !== swap.receiverId)
    throw new Error("Only lesson participants can review.");
  if (!["accepted", "completed"].includes(swap.status))
    throw new Error("Only accepted or completed lessons can be reviewed.");
  if (
    alreadyReviewed ||
    (isLearner ? swap.learnerReviewed : swap.teacherReviewed)
  )
    throw new Error("You have already reviewed this lesson.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new Error("Choose a rating from 1 to 5.");
  if (
    !Number.isFinite(swap.credits) ||
    swap.credits <= 0 ||
    swap.duration <= 0 ||
    swap.credits !== swap.duration
  )
    throw new Error("Invalid lesson cost.");
  if (!Number.isFinite(new Date(swap.dateTime).getTime()))
    throw new Error("Invalid lesson date.");
  if (
    swap.status === "accepted" &&
    new Date(swap.dateTime).getTime() + swap.duration * 3600000 > now
  )
    throw new Error("Complete the lesson after its scheduled end time.");
  const settle = swap.status !== "completed";
  if (settle && learner.credits < swap.credits)
    throw new Error(
      "The learner needs more Galleons before this lesson can be settled.",
    );
  const target = isLearner ? teacher : learner;
  const reviewUpdate = {
    rating:
      (target.rating * target.totalReviews + rating) /
      (target.totalReviews + 1),
    totalReviews: target.totalReviews + 1,
  };
  return {
    swap: {
      status: "completed" as const,
      ...(isLearner ? { learnerReviewed: true } : { teacherReviewed: true }),
    },
    teacher: {
      ...(settle
        ? {
            credits: teacher.credits + swap.credits,
            taughtHours: teacher.taughtHours + swap.duration,
          }
        : {}),
      ...(isLearner ? reviewUpdate : {}),
    },
    learner: {
      ...(settle ? { credits: learner.credits - swap.credits } : {}),
      ...(!isLearner ? reviewUpdate : {}),
    },
  };
}
export function validateBooking(
  learner: UserProfile,
  teacher: UserProfile,
  skill: string,
  duration: number,
  dateTime: string,
  now = Date.now(),
) {
  if (learner.id === teacher.id)
    throw new Error("Choose another wizard for your lesson.");
  if (!teacher.skills.includes(skill))
    throw new Error("Choose a subject offered by this tutor.");
  if (![1, 1.5, 2, 3].includes(duration))
    throw new Error("Choose a valid lesson duration.");
  const start = new Date(dateTime).getTime();
  if (!Number.isFinite(start) || start <= now)
    throw new Error("Choose a lesson time in the future.");
  if (learner.credits < duration)
    throw new Error("You need more Galleons to book this lesson.");
}
export function localDateTime(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
export const escapeIcs = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

import React, { useState } from "react";
import { UserProfile, SwapRequest, Review } from "../types";
import { db, doc, runTransaction, collection } from "../firebase";
import {
  assertTransition,
  completionUpdates,
  escapeIcs,
} from "../utils/lessonRules";
import { useModal } from "../utils/useModal";
import {
  Calendar,
  Clock,
  Check,
  X,
  ShieldCheck,
  Star,
  AlertCircle,
  MessageSquare,
  Download,
  Filter,
  Sparkles,
} from "lucide-react";
import {
  playGalleonClink,
  playMagicalSparkle,
  playWandSwoosh,
} from "../utils/audio";

interface RequestManagerProps {
  currentProfile: UserProfile | null;
  allSwaps: SwapRequest[];
  onOpenChat: (targetId: string) => void;
}

export default function RequestManager({
  currentProfile,
  allSwaps,
  onOpenChat,
}: RequestManagerProps) {
  const [selectedSwapForReview, setSelectedSwapForReview] =
    useState<SwapRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useModal(!!selectedSwapForReview, () => setSelectedSwapForReview(null));

  if (!currentProfile) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl bg-[#fffcf5] dark:bg-[#181f2e] border border-[#d9d1c1] dark:border-[#303747] shadow-sm p-6 text-center">
        <p className="text-sm font-medium text-[#756e64] dark:text-[#c9ac77] font-serif">
          Please select a witch or wizard profile in the header to manage spell
          exchanges.
        </p>
      </div>
    );
  }

  // Filter requests
  const outgoingSwaps = allSwaps.filter(
    (s) => s.requesterId === currentProfile.id,
  );
  const incomingSwaps = allSwaps.filter(
    (s) => s.receiverId === currentProfile.id,
  );

  const filterByStatus = (list: SwapRequest[]) => {
    if (statusFilter === "all") return list;
    return list.filter((s) => s.status === statusFilter);
  };

  const handleUpdateStatus = async (
    swapId: string,
    newStatus: SwapRequest["status"],
  ) => {
    if (busyId) return;
    setBusyId(swapId);
    setActionError("");
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "swaps", swapId);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Lesson not found.");
        const fresh = { ...snap.data(), id: snap.id } as SwapRequest;
        assertTransition(fresh, currentProfile.id, newStatus);
        tx.update(ref, { status: newStatus });
      });
      if (newStatus === "accepted") playMagicalSparkle();
      else playWandSwoosh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Could not update lesson. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenReviewModal = (swap: SwapRequest) => {
    setSelectedSwapForReview(swap);
    setRating(5);
    setComment("");
    setReviewError("");
    playWandSwoosh();
  };

  const downloadIcsCalendar = (swap: SwapRequest) => {
    try {
      const isTeacher = swap.receiverId === currentProfile.id;
      const partnerName = isTeacher ? swap.requesterName : swap.receiverName;
      const title = `Hogwarts Lesson: ${swap.skill} with ${partnerName}`;
      const startDate = new Date(swap.dateTime);
      const endDate = new Date(
        startDate.getTime() + swap.duration * 60 * 60 * 1000,
      );

      const formatIcsDate = (d: Date) =>
        d.toISOString().replace(/-|:|\.\d+/g, "");

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hogwarts Hourglass//Spell Bank//EN",
        "BEGIN:VEVENT",
        `UID:${swap.id}@hackwarts.local`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `SUMMARY:${escapeIcs(title)}`,
        `DESCRIPTION:${escapeIcs(swap.notes || "Hogwarts Spell Exchange Lesson")}`,
        `DTSTART:${formatIcsDate(startDate)}`,
        `DTEND:${formatIcsDate(endDate)}`,
        `LOCATION:Hogwarts School of Witchcraft and Wizardry`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Hogwarts_${swap.skill.replace(/\s+/g, "_")}.ics`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate .ics:", e);
    }
  };

  const handleSubmitReviewAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwapForReview) return;
    if (!comment.trim()) {
      setReviewError(
        "Please write a short comment about your magical instruction.",
      );
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    const swap = selectedSwapForReview;
    const isLearner = swap.requesterId === currentProfile.id;
    const targetUserId = isLearner ? swap.receiverId : swap.requesterId;

    try {
      await runTransaction(db, async (tx) => {
        const swapRef = doc(db, "swaps", swap.id);
        const teacherRef = doc(db, "users", swap.receiverId);
        const learnerRef = doc(db, "users", swap.requesterId);
        const reviewRef = doc(db, "reviews", `${swap.id}_${currentProfile.id}`);
        const [freshSwap, teacher, learner, review] = await Promise.all([
          tx.get(swapRef),
          tx.get(teacherRef),
          tx.get(learnerRef),
          tx.get(reviewRef),
        ]);
        if (!freshSwap.exists() || !teacher.exists() || !learner.exists())
          throw new Error("Lesson participants could not be found.");
        const fresh = { ...freshSwap.data(), id: swap.id } as SwapRequest;
        const updates = completionUpdates(
          fresh,
          currentProfile.id,
          teacher.data() as UserProfile,
          learner.data() as UserProfile,
          rating,
          review.exists(),
        );
        tx.set(reviewRef, {
          id: reviewRef.id,
          swapId: swap.id,
          authorId: currentProfile.id,
          authorName: currentProfile.displayName,
          targetId: targetUserId,
          rating,
          comment: comment.trim(),
          role: isLearner ? "learner" : "teacher",
          createdAt: new Date().toISOString(),
        });
        tx.update(swapRef, updates.swap);
        tx.update(teacherRef, updates.teacher);
        tx.update(learnerRef, updates.learner);
      });
      playGalleonClink();
      setSelectedSwapForReview(null);
    } catch (err) {
      console.error("Error submitting review and complete:", err);
      setReviewError(
        err instanceof Error
          ? err.message
          : "Failed to record review. Please try again.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderSwapCard = (swap: SwapRequest, type: "incoming" | "outgoing") => {
    const isTeacher = type === "incoming";
    const otherPartyName = isTeacher ? swap.requesterName : swap.receiverName;
    const formattedDate = new Date(swap.dateTime).toLocaleDateString(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    const statusStyles: Record<SwapRequest["status"], string> = {
      pending: "bg-[#c9a66b] text-[#151c29] border-[#d9d1c1] shadow-sm",
      accepted: "bg-[#1A472A] text-[#c9ac77] border-[#d9d1c1] shadow-sm",
      completed: "bg-[#856943] text-[#c9ac77] border-[#d9d1c1] shadow-sm",
      declined:
        "bg-[#f4f0e7] dark:bg-[#1e2737] text-[#756e64]/60 dark:text-white/60 border-[#d9d1c1]/20",
      cancelled:
        "bg-[#f4f0e7] dark:bg-[#1e2737] text-[#756e64]/60 dark:text-white/60 border-[#d9d1c1]/20",
    };

    const hasReviewed = isTeacher ? swap.teacherReviewed : swap.learnerReviewed;

    return (
      <div
        key={swap.id}
        className="rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] p-5 shadow-sm dark:shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1 text-[#302d28] dark:text-[#eee9de]"
      >
        <div>
          {/* Card Title & Status */}
          <div className="flex items-center justify-between mb-3">
            <span
              className={`rounded-xl border px-3 py-1 text-[10px] font-medium uppercase tracking-wider ${statusStyles[swap.status]}`}
            >
              ✦ {swap.status}
            </span>
            <div className="flex items-center gap-1 text-xs font-medium text-[#151c29] bg-[#c9a66b] border border-[#d9d1c1] rounded-full px-3 py-0.5 shadow-sm">
              <span>{swap.credits} Galleons 🪙</span>
            </div>
          </div>

          {/* Skill Title */}
          <h4 className="text-base font-medium font-serif text-[#756e64] dark:text-[#c9ac77]">
            {swap.skill}
          </h4>

          {/* Peer Details */}
          <p className="text-xs text-[#756e64]/70 dark:text-white/70 mt-1 font-bold">
            {isTeacher ? "Student Apprentice:" : "Spellmaster Tutor:"}{" "}
            <span className="font-medium text-[#856943] dark:text-[#c9ac77]">
              {otherPartyName}
            </span>
          </p>

          {/* Time & Duration */}
          <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-[#756e64]/80 dark:text-white/80 bg-[#f4f0e7] dark:bg-[#1e2737] p-3 rounded-2xl border border-[#d9d1c1]/15 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#856943] dark:text-[#c9a66b] stroke-[2.5]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c9a66b] stroke-[2.5]" />
              <span>
                {swap.duration} {swap.duration === 1 ? "Hour" : "Hours"} class
                session
              </span>
            </div>
          </div>

          {/* Notes */}
          {swap.notes && (
            <p className="mt-3 rounded-xl bg-[#f4f0e7] dark:bg-[#1e2737] p-3 text-[11px] font-medium text-[#756e64]/80 dark:text-white/80 border border-[#d9d1c1]/15 italic">
              "{swap.notes}"
            </p>
          )}
        </div>

        {/* Actions bar */}
        <div className="mt-5 pt-3 border-t-2 border-[#d9d1c1]/10 dark:border-white/10 flex flex-wrap gap-2 justify-end">
          {/* Calendar Export for Accepted */}
          {swap.status === "accepted" && (
            <button
              onClick={() => downloadIcsCalendar(swap)}
              className="flex items-center gap-1 rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] hover:bg-[#c9a66b]/20 px-2.5 py-1.5 text-xs font-medium text-[#756e64] dark:text-[#c9ac77] shadow-sm cursor-pointer"
              title="Add to Google/Apple Calendar (.ics)"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add to Cal</span>
            </button>
          )}

          {/* Direct Coordinate Chat */}
          <button
            onClick={() =>
              onOpenChat(isTeacher ? swap.requesterId : swap.receiverId)
            }
            className="flex items-center gap-1.5 rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#c9a66b] hover:bg-[#c9a66b]/90 px-3 py-1.5 text-xs font-medium text-[#151c29] shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 stroke-[2.5]" />
            Owl Chat
          </button>

          {/* Pending Inbound Actions (Teacher accepts/declines) */}
          {isTeacher && swap.status === "pending" && (
            <>
              <button
                disabled={busyId !== null}
                onClick={() => handleUpdateStatus(swap.id, "declined")}
                className="rounded-xl border border-[#d9d1c1] dark:border-white/20 bg-[#fffcf5] dark:bg-[#1e2737] text-[#856943] dark:text-[#c9ac77] px-3 py-1.5 text-xs font-medium shadow-sm cursor-pointer"
              >
                Decline
              </button>
              <button
                disabled={busyId !== null}
                onClick={() => handleUpdateStatus(swap.id, "accepted")}
                className="flex items-center gap-1.5 rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#856943] text-[#c9ac77] px-3.5 py-1.5 text-xs font-medium shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                Accept Spell Trade
              </button>
            </>
          )}

          {/* Pending/Accepted Outbound Cancel action (Learner cancels) */}
          {!isTeacher &&
            (swap.status === "pending" || swap.status === "accepted") && (
              <button
                disabled={busyId !== null}
                onClick={() => handleUpdateStatus(swap.id, "cancelled")}
                className="rounded-xl border border-[#d9d1c1] dark:border-white/20 bg-[#fffcf5] dark:bg-[#1e2737] text-[#756e64]/60 dark:text-white/60 px-3 py-1.5 text-xs font-medium shadow-sm cursor-pointer"
              >
                Cancel Owl
              </button>
            )}

          {/* Completion & Review actions */}
          {swap.status === "accepted" && (
            <button
              disabled={
                new Date(swap.dateTime).getTime() + swap.duration * 3600000 >
                Date.now()
              }
              title="Completion unlocks after the scheduled lesson ends"
              onClick={() => handleOpenReviewModal(swap)}
              className="flex items-center gap-1 rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#856943] text-[#c9ac77] px-3 py-1.5 text-xs font-medium shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              Complete Lesson & Review
            </button>
          )}

          {/* Review status indicator if completed */}
          {swap.status === "completed" && (
            <div className="text-xs font-medium text-[#1A472A] dark:text-[#4ECDC4] py-1 px-2 flex items-center gap-1">
              {hasReviewed ? (
                "✓ Reviewed & Vault Settled"
              ) : (
                <button
                  onClick={() => handleOpenReviewModal(swap)}
                  className="text-[#856943] dark:text-[#c9ac77] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  Leave a Spell Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const incomingFiltered = filterByStatus(incomingSwaps);
  const outgoingFiltered = filterByStatus(outgoingSwaps);

  return (
    <div className="space-y-10 text-[#302d28] dark:text-[#eee9de]">
      {actionError && (
        <p role="alert" className="match-notice">
          {actionError}
        </p>
      )}

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] p-5 sm:p-6 shadow-sm dark:shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium font-serif text-[#756e64] dark:text-[#c9ac77]">
            Hogwarts Lesson Ledger 📜
          </h2>
          <p className="text-xs font-semibold text-[#756e64]/70 dark:text-white/70 mt-1">
            Track pending requests, active scheduled spell trades, and completed
            reviews.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "accepted", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#856943] text-[#c9ac77] border border-[#d9d1c1] dark:border-[#303747] shadow-sm"
                  : "bg-[#f4f0e7] dark:bg-[#1e2737] text-[#756e64] dark:text-white border border-[#d9d1c1]/20 hover:bg-[#c9a66b]/20"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Incoming Swaps Section (Teaching) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-medium font-serif text-[#756e64] dark:text-[#c9ac77] flex items-center gap-2">
            Incoming Tutoring Requests (I'm Teaching)
          </h3>
          <span className="rounded-xl bg-[#c9a66b] border border-[#d9d1c1] dark:border-[#303747] px-3 py-1 text-xs font-medium text-[#151c29] shadow-sm">
            {incomingFiltered.length} Sessions
          </span>
        </div>

        {incomingFiltered.length === 0 ? (
          <div className="rounded-2xl border border-[#d9d1c1] border-dashed bg-[#fffcf5] dark:bg-[#181f2e] p-8 text-center shadow-sm">
            <p className="text-xs text-[#756e64]/60 dark:text-white/60 italic font-bold">
              No incoming lesson owls found with filter "{statusFilter}". Add
              more spellcraft offerings to your profile so other Hogwarts
              students can discover and book exchanges with you!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {incomingFiltered.map((swap) => renderSwapCard(swap, "incoming"))}
          </div>
        )}
      </div>

      {/* 2. Outgoing Swaps Section (Learning) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-medium font-serif text-[#756e64] dark:text-[#c9ac77] flex items-center gap-2">
            Outgoing Study Requests (I'm Learning)
          </h3>
          <span className="rounded-xl bg-[#c9a66b] border border-[#d9d1c1] dark:border-[#303747] px-3 py-1 text-xs font-medium text-[#151c29] shadow-sm">
            {outgoingFiltered.length} Sessions
          </span>
        </div>

        {outgoingFiltered.length === 0 ? (
          <div className="rounded-2xl border border-[#d9d1c1] border-dashed bg-[#fffcf5] dark:bg-[#181f2e] p-8 text-center shadow-sm">
            <p className="text-xs text-[#756e64]/60 dark:text-white/60 italic font-bold">
              You haven't requested any spell trades with filter "{statusFilter}
              ". Head over to Sorting Hat Matches to seek tutoring from fellow
              Hogwarts classmates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outgoingFiltered.map((swap) => renderSwapCard(swap, "outgoing"))}
          </div>
        )}
      </div>

      {/* Complete and Review Modal overlay */}
      {selectedSwapForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#756e64]/60 p-4 backdrop-blur-xs animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Review your lesson"
            className="w-full max-w-md rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] p-6 sm:p-8 shadow-sm dark:shadow-lg animate-scale-up text-[#302d28] dark:text-[#eee9de]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium font-serif text-[#756e64] dark:text-[#c9ac77]">
                Complete & Review Lesson 🌟
              </h3>
              <button
                onClick={() => setSelectedSwapForReview(null)}
                aria-label="Close review"
                className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] p-1.5 text-[#756e64] dark:text-[#c9ac77] hover:bg-[#c9a66b]/20 cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#756e64]/70 dark:text-white/70 mb-5 leading-relaxed">
              Completing this exchange will transfer{" "}
              <strong className="text-[#856943] dark:text-[#c9ac77]">
                {selectedSwapForReview.credits} Galleons 🪙
              </strong>{" "}
              and log the class hours in the Hogwarts Hourglass ledger. Please
              rate your classmate's instruction!
            </p>

            {reviewError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#856943]/15 p-3 text-xs font-bold text-[#856943] dark:text-[#c9ac77] border border-[#856943]">
                <AlertCircle className="h-5 w-5 text-[#856943] shrink-0 stroke-[2.5]" />
                <span>{reviewError}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmitReviewAndComplete}
              className="space-y-5"
            >
              {/* Star Rating selector */}
              <div>
                <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-2">
                  Spellcraft Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} out of 5 stars`}
                      aria-pressed={star <= rating}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90 cursor-pointer"
                    >
                      <Star
                        className={`h-8 w-8 stroke-[1.5] ${
                          star <= rating
                            ? "fill-[#c9a66b] stroke-[#756e64] dark:stroke-[#c9ac77]"
                            : "text-[#756e64]/20 dark:text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-medium text-[#756e64] dark:text-[#c9ac77]">
                    {rating} / 5 stars
                  </span>
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
                  Review Testimonial
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share how your spell swap went! Was your wizard/witch tutor clear? Did you master the incantation and wand motions together?"
                  className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3 py-2.5 text-xs font-semibold text-[#756e64] dark:text-white placeholder-[#756e64]/40 dark:placeholder-white/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSwapForReview(null)}
                  className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#1e2737] text-[#756e64] dark:text-[#c9ac77] font-medium px-4 py-2.5 text-xs shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#856943] text-[#c9ac77] font-medium px-5 py-2.5 text-xs shadow-sm dark:shadow-lg active:translate-y-0.5 cursor-pointer"
                >
                  {isSubmittingReview
                    ? "Submitting..."
                    : "Submit Review & Complete Trade 🪄"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

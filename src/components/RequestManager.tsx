import React, { useState } from "react";
import { UserProfile, SwapRequest, Review } from "../types";
import { db, doc, updateDoc, writeBatch, collection, increment } from "../firebase";
import { Calendar, Clock, Check, X, ShieldCheck, Star, AlertCircle, MessageSquare, Download, Filter, Sparkles } from "lucide-react";
import { playGalleonClink, playMagicalSparkle, playWandSwoosh } from "../utils/audio";

interface RequestManagerProps {
  currentProfile: UserProfile | null;
  allSwaps: SwapRequest[];
  onOpenChat: (targetId: string) => void;
}

export default function RequestManager({
  currentProfile,
  allSwaps,
  onOpenChat
}: RequestManagerProps) {
  const [selectedSwapForReview, setSelectedSwapForReview] = useState<SwapRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!currentProfile) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[2.5rem] bg-white dark:bg-[#1C1625] border-4 border-[#4A321E] dark:border-[#FFE894] shadow-[6px_6px_0px_#4A321E] p-6 text-center">
        <p className="text-sm font-black text-[#4A321E] dark:text-[#FFE894] font-serif">
          Please select a witch or wizard profile in the header to manage spell exchanges.
        </p>
      </div>
    );
  }

  // Filter requests
  const outgoingSwaps = allSwaps.filter(s => s.requesterId === currentProfile.id);
  const incomingSwaps = allSwaps.filter(s => s.receiverId === currentProfile.id);

  const filterByStatus = (list: SwapRequest[]) => {
    if (statusFilter === "all") return list;
    return list.filter(s => s.status === statusFilter);
  };

  const handleUpdateStatus = async (swapId: string, newStatus: SwapRequest["status"]) => {
    try {
      if (newStatus === "accepted") {
        playMagicalSparkle();
      } else {
        playWandSwoosh();
      }
      const swapRef = doc(db, "swaps", swapId);
      await updateDoc(swapRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating swap status:", err);
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
      const endDate = new Date(startDate.getTime() + swap.duration * 60 * 60 * 1000);

      const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hogwarts Hourglass//Spell Bank//EN",
        "BEGIN:VEVENT",
        `SUMMARY:${title}`,
        `DESCRIPTION:${swap.notes || "Hogwarts Spell Exchange Lesson"}`,
        `DTSTART:${formatIcsDate(startDate)}`,
        `DTEND:${formatIcsDate(endDate)}`,
        `LOCATION:Hogwarts School of Witchcraft and Wizardry`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Hogwarts_${swap.skill.replace(/\s+/g, "_")}.ics`);
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
      setReviewError("Please write a short comment about your magical instruction.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    const swap = selectedSwapForReview;
    const isLearner = swap.requesterId === currentProfile.id;
    const targetUserId = isLearner ? swap.receiverId : swap.requesterId;

    try {
      const batch = writeBatch(db);

      // 1. Create Review document
      const reviewRef = doc(collection(db, "reviews"));
      const reviewData: Review = {
        id: reviewRef.id,
        swapId: swap.id,
        authorId: currentProfile.id,
        authorName: currentProfile.displayName,
        targetId: targetUserId,
        rating,
        comment,
        role: isLearner ? "learner" : "teacher",
        createdAt: new Date().toISOString()
      };
      batch.set(reviewRef, reviewData);

      // 2. Update SwapRequest review flag
      const swapRef = doc(db, "swaps", swap.id);
      const updatedFields: any = {};
      if (isLearner) {
        updatedFields.learnerReviewed = true;
      } else {
        updatedFields.teacherReviewed = true;
      }

      if (swap.status !== "completed") {
        updatedFields.status = "completed";

        // Credit transfer ledger transaction
        const teacherRef = doc(db, "users", swap.receiverId);
        const learnerRef = doc(db, "users", swap.requesterId);

        batch.update(teacherRef, {
          credits: increment(swap.credits),
          taughtHours: increment(swap.duration),
          ...(isLearner ? { totalReviews: increment(1) } : {})
        });

        batch.update(learnerRef, {
          credits: increment(-swap.credits),
          ...(!isLearner ? { totalReviews: increment(1) } : {})
        });
      }

      batch.update(swapRef, updatedFields);
      await batch.commit();

      playGalleonClink();
      setSelectedSwapForReview(null);
    } catch (err) {
      console.error("Error submitting review and complete:", err);
      setReviewError("Failed to record review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderSwapCard = (swap: SwapRequest, type: "incoming" | "outgoing") => {
    const isTeacher = type === "incoming";
    const otherPartyName = isTeacher ? swap.requesterName : swap.receiverName;
    const formattedDate = new Date(swap.dateTime).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const statusStyles: Record<SwapRequest["status"], string> = {
      pending: "bg-[#ECB939] text-[#1A0F00] border-[#4A321E] shadow-[1.5px_1.5px_0px_#4A321E]",
      accepted: "bg-[#1A472A] text-[#FFE894] border-[#4A321E] shadow-[1.5px_1.5px_0px_#4A321E]",
      completed: "bg-[#740001] text-[#FFE894] border-[#4A321E] shadow-[1.5px_1.5px_0px_#4A321E]",
      declined: "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E]/60 dark:text-white/60 border-[#4A321E]/20",
      cancelled: "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E]/60 dark:text-white/60 border-[#4A321E]/20"
    };

    const hasReviewed = isTeacher ? swap.teacherReviewed : swap.learnerReviewed;

    return (
      <div 
        key={swap.id} 
        className="rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-5 shadow-[4px_4px_0px_#4A321E] dark:shadow-[4px_4px_0px_#FFE894] flex flex-col justify-between transition-all hover:-translate-y-1 text-[#2C1E14] dark:text-[#EDE7E0]"
      >
        <div>
          {/* Card Title & Status */}
          <div className="flex items-center justify-between mb-3">
            <span className={`rounded-xl border-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[swap.status]}`}>
              ✦ {swap.status}
            </span>
            <div className="flex items-center gap-1 text-xs font-black text-[#1A0F00] bg-[#ECB939] border-2 border-[#4A321E] rounded-full px-3 py-0.5 shadow-[1.5px_1.5px_0px_#4A321E]">
              <span>{swap.credits} Galleons 🪙</span>
            </div>
          </div>

          {/* Skill Title */}
          <h4 className="text-base font-black font-serif text-[#4A321E] dark:text-[#FFE894]">{swap.skill}</h4>

          {/* Peer Details */}
          <p className="text-xs text-[#4A321E]/70 dark:text-white/70 mt-1 font-bold">
            {isTeacher ? "Student Apprentice:" : "Spellmaster Tutor:"} <span className="font-black text-[#740001] dark:text-[#FFE894]">{otherPartyName}</span>
          </p>

          {/* Time & Duration */}
          <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-[#4A321E]/80 dark:text-white/80 bg-[#FDF9EE] dark:bg-[#251B33] p-3 rounded-2xl border-2 border-[#4A321E]/15 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#740001] dark:text-[#ECB939] stroke-[2.5]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#ECB939] stroke-[2.5]" />
              <span>{swap.duration} {swap.duration === 1 ? "Hour" : "Hours"} class session</span>
            </div>
          </div>

          {/* Notes */}
          {swap.notes && (
            <p className="mt-3 rounded-xl bg-[#FDF9EE] dark:bg-[#251B33] p-3 text-[11px] font-medium text-[#4A321E]/80 dark:text-white/80 border border-[#4A321E]/15 italic">
              "{swap.notes}"
            </p>
          )}
        </div>

        {/* Actions bar */}
        <div className="mt-5 pt-3 border-t-2 border-[#4A321E]/10 dark:border-white/10 flex flex-wrap gap-2 justify-end">
          
          {/* Calendar Export for Accepted */}
          {swap.status === "accepted" && (
            <button
              onClick={() => downloadIcsCalendar(swap)}
              className="flex items-center gap-1 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] hover:bg-[#ECB939]/20 px-2.5 py-1.5 text-xs font-black text-[#4A321E] dark:text-[#FFE894] shadow-[1.5px_1.5px_0px_#4A321E] cursor-pointer"
              title="Add to Google/Apple Calendar (.ics)"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add to Cal</span>
            </button>
          )}

          {/* Direct Coordinate Chat */}
          <button
            onClick={() => onOpenChat(isTeacher ? swap.requesterId : swap.receiverId)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#ECB939] hover:bg-[#ECB939]/90 px-3 py-1.5 text-xs font-black text-[#1A0F00] shadow-[1.5px_1.5px_0px_#4A321E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 stroke-[2.5]" />
            Owl Chat
          </button>

          {/* Pending Inbound Actions (Teacher accepts/declines) */}
          {isTeacher && swap.status === "pending" && (
            <>
              <button
                onClick={() => handleUpdateStatus(swap.id, "declined")}
                className="rounded-xl border-2 border-[#4A321E] dark:border-white/20 bg-white dark:bg-[#251B33] text-[#740001] dark:text-[#FFE894] px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#4A321E] cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => handleUpdateStatus(swap.id, "accepted")}
                className="flex items-center gap-1.5 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#740001] text-[#FFE894] px-3.5 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#4A321E] active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                Accept Spell Trade
              </button>
            </>
          )}

          {/* Pending/Accepted Outbound Cancel action (Learner cancels) */}
          {!isTeacher && (swap.status === "pending" || swap.status === "accepted") && (
            <button
              onClick={() => handleUpdateStatus(swap.id, "cancelled")}
              className="rounded-xl border-2 border-[#4A321E] dark:border-white/20 bg-white dark:bg-[#251B33] text-[#4A321E]/60 dark:text-white/60 px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#4A321E] cursor-pointer"
            >
              Cancel Owl
            </button>
          )}

          {/* Completion & Review actions */}
          {swap.status === "accepted" && (
            <button
              onClick={() => handleOpenReviewModal(swap)}
              className="flex items-center gap-1 rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#740001] text-[#FFE894] px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#4A321E] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              Complete Lesson & Review
            </button>
          )}

          {/* Review status indicator if completed */}
          {swap.status === "completed" && (
            <div className="text-xs font-black text-[#1A472A] dark:text-[#4ECDC4] py-1 px-2 flex items-center gap-1">
              {hasReviewed ? "✓ Reviewed & Vault Settled" : (
                <button
                  onClick={() => handleOpenReviewModal(swap)}
                  className="text-[#740001] dark:text-[#FFE894] hover:underline flex items-center gap-1 cursor-pointer font-black"
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
    <div className="space-y-10 text-[#2C1E14] dark:text-[#EDE7E0]">
      
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-5 sm:p-6 shadow-[6px_6px_0px_#4A321E] dark:shadow-[6px_6px_0px_#FFE894]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
            Hogwarts Lesson Ledger 📜
          </h2>
          <p className="text-xs font-semibold text-[#4A321E]/70 dark:text-white/70 mt-1">
            Track pending requests, active scheduled spell trades, and completed reviews.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "accepted", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#740001] text-[#FFE894] border-2 border-[#4A321E] dark:border-[#FFE894] shadow-[2px_2px_0px_#4A321E]"
                  : "bg-[#FDF9EE] dark:bg-[#251B33] text-[#4A321E] dark:text-white border-2 border-[#4A321E]/20 hover:bg-[#ECB939]/20"
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
          <h3 className="text-lg sm:text-xl font-black font-serif text-[#4A321E] dark:text-[#FFE894] flex items-center gap-2">
            Incoming Tutoring Requests (I'm Teaching)
          </h3>
          <span className="rounded-xl bg-[#ECB939] border-2 border-[#4A321E] dark:border-[#FFE894] px-3 py-1 text-xs font-black text-[#1A0F00] shadow-[2px_2px_0px_#4A321E]">
            {incomingFiltered.length} Sessions
          </span>
        </div>

        {incomingFiltered.length === 0 ? (
          <div className="rounded-[2.5rem] border-4 border-[#4A321E] border-dashed bg-white dark:bg-[#1C1625] p-8 text-center shadow-[4px_4px_0px_#4A321E]">
            <p className="text-xs text-[#4A321E]/60 dark:text-white/60 italic font-bold">
              No incoming lesson owls found with filter "{statusFilter}". Add more spellcraft offerings to your profile so other Hogwarts students can discover and book exchanges with you!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {incomingFiltered.map(swap => renderSwapCard(swap, "incoming"))}
          </div>
        )}
      </div>

      {/* 2. Outgoing Swaps Section (Learning) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black font-serif text-[#4A321E] dark:text-[#FFE894] flex items-center gap-2">
            Outgoing Study Requests (I'm Learning)
          </h3>
          <span className="rounded-xl bg-[#ECB939] border-2 border-[#4A321E] dark:border-[#FFE894] px-3 py-1 text-xs font-black text-[#1A0F00] shadow-[2px_2px_0px_#4A321E]">
            {outgoingFiltered.length} Sessions
          </span>
        </div>

        {outgoingFiltered.length === 0 ? (
          <div className="rounded-[2.5rem] border-4 border-[#4A321E] border-dashed bg-white dark:bg-[#1C1625] p-8 text-center shadow-[4px_4px_0px_#4A321E]">
            <p className="text-xs text-[#4A321E]/60 dark:text-white/60 italic font-bold">
              You haven't requested any spell trades with filter "{statusFilter}". Head over to Sorting Hat Matches to seek tutoring from fellow Hogwarts classmates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outgoingFiltered.map(swap => renderSwapCard(swap, "outgoing"))}
          </div>
        )}
      </div>

      {/* Complete and Review Modal overlay */}
      {selectedSwapForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-[2.5rem] border-4 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#1C1625] p-6 sm:p-8 shadow-[8px_8px_0px_#4A321E] dark:shadow-[8px_8px_0px_#FFE894] animate-scale-up text-[#2C1E14] dark:text-[#EDE7E0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black font-serif text-[#4A321E] dark:text-[#FFE894]">
                Complete & Review Lesson 🌟
              </h3>
              <button
                onClick={() => setSelectedSwapForReview(null)}
                className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] p-1.5 text-[#4A321E] dark:text-[#FFE894] hover:bg-[#ECB939]/20 cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#4A321E]/70 dark:text-white/70 mb-5 leading-relaxed">
              Completing this exchange will transfer <strong className="text-[#740001] dark:text-[#FFE894]">{selectedSwapForReview.credits} Galleons 🪙</strong> and log the class hours in the Hogwarts Hourglass ledger. Please rate your classmate's instruction!
            </p>

            {reviewError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#740001]/15 p-3 text-xs font-bold text-[#740001] dark:text-[#FFE894] border-2 border-[#740001]">
                <AlertCircle className="h-5 w-5 text-[#740001] shrink-0 stroke-[2.5]" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReviewAndComplete} className="space-y-5">
              {/* Star Rating selector */}
              <div>
                <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-2">
                  Spellcraft Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90 cursor-pointer"
                    >
                      <Star
                        className={`h-8 w-8 stroke-[1.5] ${
                          star <= rating ? "fill-[#ECB939] stroke-[#4A321E] dark:stroke-[#FFE894]" : "text-[#4A321E]/20 dark:text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-black text-[#4A321E] dark:text-[#FFE894]">{rating} / 5 stars</span>
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-xs font-black text-[#4A321E] dark:text-[#FFE894] uppercase tracking-wider mb-1.5">
                  Review Testimonial
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share how your spell swap went! Was your wizard/witch tutor clear? Did you master the incantation and wand motions together?"
                  className="block w-full rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#FDF9EE] dark:bg-[#251B33] px-3 py-2.5 text-xs font-semibold text-[#4A321E] dark:text-white placeholder-[#4A321E]/40 dark:placeholder-white/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSwapForReview(null)}
                  className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-white dark:bg-[#251B33] text-[#4A321E] dark:text-[#FFE894] font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#4A321E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="rounded-xl border-2 border-[#4A321E] dark:border-[#FFE894] bg-[#740001] text-[#FFE894] font-black px-5 py-2.5 text-xs shadow-[3px_3px_0px_#4A321E] dark:shadow-[3px_3px_0px_#FFE894] active:translate-y-0.5 cursor-pointer"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review & Complete Trade 🪄"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

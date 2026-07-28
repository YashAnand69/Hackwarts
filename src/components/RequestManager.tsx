import React, { useState } from "react";
import { UserProfile, SwapRequest, Review } from "../types";
import { db, doc, updateDoc, writeBatch, collection, addDoc, increment } from "../firebase";
import { Calendar, Clock, Check, X, ShieldCheck, Star, AlertCircle, MessageSquare } from "lucide-react";

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

  if (!currentProfile) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl bg-white border-4 border-[#2D2D2D] shadow-[4px_4px_0px_#2D2D2D] p-6 text-center">
        <p className="text-sm font-black text-[#2D2D2D] font-sans">Please select a profile in the header to manage exchanges.</p>
      </div>
    );
  }

  // Filter requests
  // Outgoing: activeProfile is learner
  const outgoingSwaps = allSwaps.filter(s => s.requesterId === currentProfile.id);
  // Incoming: activeProfile is teacher
  const incomingSwaps = allSwaps.filter(s => s.receiverId === currentProfile.id);

  const handleUpdateStatus = async (swapId: string, newStatus: SwapRequest["status"]) => {
    try {
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
  };

  const handleSubmitReviewAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwapForReview) return;
    if (!comment.trim()) {
      setReviewError("Please write a short comment about your exchange.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    const swap = selectedSwapForReview;
    const isLearner = swap.requesterId === currentProfile.id;
    const targetUserId = isLearner ? swap.receiverId : swap.requesterId;
    const targetUserName = isLearner ? swap.receiverName : swap.requesterName;

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

      // If BOTH have reviewed, or if we mark as completed on the first review
      // Let's set status to "completed" upon the first completion/review submit
      // and do the Credit Transfer ledger transaction!
      if (swap.status !== "completed") {
        updatedFields.status = "completed";

        // CREDIT SYSTEM LEDGER TRANSACTION (TIME-BANK TRANSFER):
        // Teacher (receiverId) receives the credits: add swap.credits
        // Learner (requesterId) spends the credits: subtract swap.credits
        const teacherRef = doc(db, "users", swap.receiverId);
        const learnerRef = doc(db, "users", swap.requesterId);

        batch.update(teacherRef, {
          credits: increment(swap.credits),
          taughtHours: increment(swap.duration),
          // Increment total reviews on teacher if learner is reviewing them
          ...(isLearner ? {
            totalReviews: increment(1),
            // Rough rating update (can do full re-calc in a function, but let's increment cleanly)
            // Rating adjustment: (currentAverage * total + newRating) / (total + 1)
            // For simple instant update we can simulate or increment
          } : {})
        });

        batch.update(learnerRef, {
          credits: increment(-swap.credits),
          ...(!isLearner ? {
            totalReviews: increment(1),
          } : {})
        });
      }

      batch.update(swapRef, updatedFields);
      await batch.commit();

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
      pending: "bg-[#FFE66D] text-[#2D2D2D] border-[#2D2D2D] shadow-[1.5px_1.5px_0px_#2D2D2D]",
      accepted: "bg-[#4ECDC4] text-[#2D2D2D] border-[#2D2D2D] shadow-[1.5px_1.5px_0px_#2D2D2D]",
      completed: "bg-[#E1F7F5] text-[#1D7A73] border-[#4ECDC4] shadow-[1.5px_1.5px_0px_#4ECDC4]",
      declined: "bg-[#F3F3F3] text-[#2D2D2D]/60 border-[#2D2D2D]/20",
      cancelled: "bg-[#F3F3F3] text-[#2D2D2D]/60 border-[#2D2D2D]/20"
    };

    const hasReviewed = isTeacher ? swap.teacherReviewed : swap.learnerReviewed;

    return (
      <div key={swap.id} className="rounded-[2rem] border-4 border-[#2D2D2D] bg-white p-5 shadow-[4px_4px_0px_#2D2D2D] flex flex-col justify-between transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#FFE66D]">
        <div>
          {/* Card Title & Status */}
          <div className="flex items-center justify-between mb-4">
            <span className={`rounded-xl border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[swap.status]}`}>
              {swap.status}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-[#2D2D2D] bg-[#FFE66D]/20 border-2 border-[#2D2D2D] rounded-full px-3 py-0.5 shadow-[1.5px_1.5px_0px_#2D2D2D]">
              <span>{swap.credits} {swap.credits === 1 ? "Credit" : "Credits"}</span>
            </div>
          </div>

          {/* Skill Title */}
          <h4 className="text-base font-black text-[#2D2D2D]">{swap.skill}</h4>

          {/* Peer Details */}
          <p className="text-xs text-[#2D2D2D]/60 mt-1.5 font-bold">
            {isTeacher ? "Learner:" : "Teacher:"} <span className="font-black text-[#2D2D2D]">{otherPartyName}</span>
          </p>

          {/* Time & Duration */}
          <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-[#2D2D2D]/70">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#FF6B6B] stroke-[2.5]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-[#4ECDC4] stroke-[2.5]" />
              <span>{swap.duration} {swap.duration === 1 ? "Hour" : "Hours"} swap</span>
            </div>
          </div>

          {/* Notes */}
          {swap.notes && (
            <p className="mt-4 rounded-xl bg-[#F3F3F3] p-3 text-xs font-medium text-[#2D2D2D]/80 border-2 border-[#2D2D2D]/10 italic">
              "{swap.notes}"
            </p>
          )}
        </div>

        {/* Actions bar */}
        <div className="mt-5 pt-4 border-t-2 border-[#2D2D2D]/10 flex flex-wrap gap-2 justify-end">
          {/* Direct Coordinate Chat */}
          <button
            onClick={() => onOpenChat(isTeacher ? swap.requesterId : swap.receiverId)}
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#2D2D2D] bg-white hover:bg-[#FDFCF8] px-3 py-1.5 text-xs font-black text-[#2D2D2D] shadow-[1.5px_1.5px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#2D2D2D] transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 stroke-[2]" />
            Chat
          </button>

          {/* Pending Inbound Actions (Teacher accepts/declines) */}
          {isTeacher && swap.status === "pending" && (
            <>
              <button
                onClick={() => handleUpdateStatus(swap.id, "declined")}
                className="rounded-lg border-2 border-[#2D2D2D] bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#2D2D2D] transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => handleUpdateStatus(swap.id, "accepted")}
                className="flex items-center gap-1.5 rounded-lg border-2 border-[#2D2D2D] bg-[#4ECDC4] text-[#2D2D2D] px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#2D2D2D] transition-all cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                Accept Swap
              </button>
            </>
          )}

          {/* Pending/Accepted Outbound Cancel action (Learner cancels) */}
          {!isTeacher && (swap.status === "pending" || swap.status === "accepted") && (
            <button
              onClick={() => handleUpdateStatus(swap.id, "cancelled")}
              className="rounded-lg border-2 border-[#2D2D2D] bg-white hover:bg-[#F3F3F3] text-[#2D2D2D]/60 px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#2D2D2D] transition-all cursor-pointer"
            >
              Cancel Exchange
            </button>
          )}

          {/* Completion & Review actions */}
          {swap.status === "accepted" && (
            <button
              onClick={() => handleOpenReviewModal(swap)}
              className="flex items-center gap-1 rounded-lg border-2 border-[#2D2D2D] bg-[#FF6B6B] text-white px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#2D2D2D] transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 stroke-[2]" />
              Complete & Review
            </button>
          )}

          {/* Review status indicator if completed */}
          {swap.status === "completed" && (
            <div className="text-xs font-black text-[#2D2D2D]/50 py-1.5 px-2 flex items-center">
              {hasReviewed ? "✓ Reviewed & Swapped" : (
                <button
                  onClick={() => handleOpenReviewModal(swap)}
                  className="text-[#FF6B6B] hover:underline flex items-center gap-1 cursor-pointer font-black"
                >
                  Leave a Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      
      {/* 1. Incoming Swaps Section (Teaching) */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-[#2D2D2D] flex items-center gap-2">
            Incoming Swaps (I'm Teaching)
          </h3>
          <span className="rounded-xl bg-[#FFE66D] border-2 border-[#2D2D2D] px-3 py-1 text-xs font-black text-[#2D2D2D] shadow-[2px_2px_0px_#2D2D2D]">
            {incomingSwaps.length} Active
          </span>
        </div>

        {incomingSwaps.length === 0 ? (
          <div className="rounded-[2rem] border-4 border-[#2D2D2D] border-dashed bg-white p-8 text-center shadow-[4px_4px_0px_#2D2D2D]">
            <p className="text-xs text-[#2D2D2D]/60 italic font-bold">No incoming lesson requests yet. Add more skill tags to your profile so neighbors can discover and book exchanges with you!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {incomingSwaps.map(swap => renderSwapCard(swap, "incoming"))}
          </div>
        )}
      </div>

      {/* 2. Outgoing Swaps Section (Learning) */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-[#2D2D2D] flex items-center gap-2">
            Requested Swaps (I'm Learning)
          </h3>
          <span className="rounded-xl bg-[#FFE66D] border-2 border-[#2D2D2D] px-3 py-1 text-xs font-black text-[#2D2D2D] shadow-[2px_2px_0px_#2D2D2D]">
            {outgoingSwaps.length} Active
          </span>
        </div>

        {outgoingSwaps.length === 0 ? (
          <div className="rounded-[2rem] border-4 border-[#2D2D2D] border-dashed bg-white p-8 text-center shadow-[4px_4px_0px_#2D2D2D]">
            <p className="text-xs text-[#2D2D2D]/60 italic font-bold">You haven't requested any swaps yet. Head over to Smart Matches to request a lesson from a local neighbor!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outgoingSwaps.map(swap => renderSwapCard(swap, "outgoing"))}
          </div>
        )}
      </div>

      {/* Complete and Review Modal overlay */}
      {selectedSwapForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-[#2D2D2D] bg-white p-6 shadow-[8px_8px_0px_#2D2D2D] animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#2D2D2D]">Complete & Review Swap</h3>
              <button
                onClick={() => setSelectedSwapForReview(null)}
                className="rounded-xl border-2 border-[#2D2D2D] p-1.5 text-[#2D2D2D] hover:bg-[#F3F3F3] cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#2D2D2D]/60 mb-5 leading-relaxed">
              Completing this exchange will transfer <strong className="text-[#FF6B6B]">{selectedSwapForReview.credits} time credits</strong> and log completed hours in the community time ledger. Please rate your experience!
            </p>

            {reviewError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FF6B6B]/15 p-3 text-xs font-bold text-[#2D2D2D] border-2 border-[#2D2D2D]">
                <AlertCircle className="h-5 w-5 text-[#FF6B6B] shrink-0 stroke-[2.5]" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReviewAndComplete} className="space-y-5">
              {/* Star Rating selector */}
              <div>
                <label className="block text-xs font-black text-[#2D2D2D] uppercase tracking-wider mb-2">
                  Overall Rating
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
                          star <= rating ? "fill-[#FFD23F] stroke-[#2D2D2D]" : "text-[#2D2D2D]/10"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-black text-[#2D2D2D]">{rating} / 5 stars</span>
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-xs font-black text-[#2D2D2D] uppercase tracking-wider mb-1.5">
                  Review Comment
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share how the swap went! Was your tutor clear? Did you enjoy learning together?"
                  className="block w-full rounded-xl border-2 border-[#2D2D2D] bg-[#F3F3F3] px-3 py-2.5 text-xs font-bold text-[#2D2D2D] placeholder-[#2D2D2D]/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSwapForReview(null)}
                  className="rounded-xl border-2 border-[#2D2D2D] bg-white text-[#2D2D2D] font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="rounded-xl border-2 border-[#2D2D2D] bg-[#FF6B6B] text-white font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] cursor-pointer"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit & Complete Swap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

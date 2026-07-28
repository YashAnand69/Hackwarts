import React, { useState } from "react";
import { UserProfile, SwapRequest } from "../types";
import { collection, addDoc, db, doc, updateDoc, increment } from "../firebase";
import { Calendar, Clock, AlertCircle, Sparkles, Check, X, ShieldAlert } from "lucide-react";

interface SwapSchedulerProps {
  currentProfile: UserProfile | null;
  targetProfile: UserProfile;
  initialSkill: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SwapScheduler({
  currentProfile,
  targetProfile,
  initialSkill,
  onClose,
  onSuccess
}: SwapSchedulerProps) {
  const [selectedSkill, setSelectedSkill] = useState(initialSkill || targetProfile.skills[0] || "");
  const [duration, setDuration] = useState(1); // Hours
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!currentProfile) return null;

  // Credit calculation: 1 credit per hour
  const requiredCredits = duration * 1;
  const hasEnoughCredits = currentProfile.credits >= requiredCredits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) {
      setError("Please select a skill to learn.");
      return;
    }
    if (!dateTime) {
      setError("Please pick a scheduled date and time.");
      return;
    }
    if (!hasEnoughCredits) {
      setError("Insufficient credits! Host an exchange to earn credits before requesting more lessons.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Add SwapRequest to Firestore
      const swapData: Omit<SwapRequest, "id"> = {
        requesterId: currentProfile.id,
        requesterName: currentProfile.displayName,
        receiverId: targetProfile.id,
        receiverName: targetProfile.displayName,
        skill: selectedSkill,
        credits: requiredCredits,
        status: "pending",
        dateTime: new Date(dateTime).toISOString(),
        duration,
        notes,
        createdAt: new Date().toISOString(),
        learnerReviewed: false,
        teacherReviewed: false
      };

      await addDoc(collection(db, "swaps"), swapData);

      // Note: We DO NOT subtract credits immediately when creating the request.
      // Credits are escrowed or subtracted ONLY upon accepted/completed lesson
      // to keep it fair in case the teacher declines!

      onSuccess();
    } catch (err) {
      console.error("Scheduling error:", err);
      setError("Failed to schedule swap. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-[2rem] border-4 border-[#2D2D2D] bg-white p-6 shadow-[8px_8px_0px_#2D2D2D] animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#4ECDC4] stroke-[2.5]" />
            <h3 className="text-lg font-black text-[#2D2D2D]">Request Skill Swap</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-[#2D2D2D] p-1.5 text-[#2D2D2D] hover:bg-[#F3F3F3] cursor-pointer transition-all"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Teacher Snapshot */}
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-[#FDFCF8] p-4 border-4 border-[#2D2D2D] shadow-[4px_4px_0px_#2D2D2D]">
          <img
            src={targetProfile.photoURL}
            alt={targetProfile.displayName}
            className="h-12 w-12 rounded-xl object-cover border-2 border-[#2D2D2D]"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-wider block">TEACHER PARTNER</span>
            <h4 className="text-xs font-black text-[#2D2D2D] mt-0.5">{targetProfile.displayName}</h4>
            <p className="text-[10px] font-bold text-[#2D2D2D]/60 mt-0.5">★ {targetProfile.rating.toFixed(1)} • {targetProfile.location}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#FF6B6B]/15 p-3 text-xs font-bold text-[#2D2D2D] border-2 border-[#2D2D2D]">
            <AlertCircle className="h-5 w-5 text-[#FF6B6B] shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Skill Selector */}
          <div>
            <label className="block text-xs font-black text-[#2D2D2D] uppercase tracking-wider mb-1.5">
              Which skill do you want to learn?
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-xl border-2 border-[#2D2D2D] bg-[#F3F3F3] px-3 py-3 text-xs font-black text-[#2D2D2D] focus:outline-none focus:ring-4 ring-[#4ECDC4]/20"
            >
              <option value="">-- Choose teaching topic --</option>
              {targetProfile.skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-[#2D2D2D] uppercase tracking-wider mb-1.5">
                Session Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="block w-full rounded-xl border-2 border-[#2D2D2D] bg-[#F3F3F3] px-3 py-3 text-xs font-black text-[#2D2D2D] focus:outline-none focus:ring-4 ring-[#4ECDC4]/20"
              >
                <option value={1}>1.0 Hour</option>
                <option value={1.5}>1.5 Hours</option>
                <option value={2}>2.0 Hours</option>
                <option value={3}>3.0 Hours</option>
              </select>
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-xs font-black text-[#2D2D2D] uppercase tracking-wider mb-1.5">
                Target Date & Time
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="block w-full rounded-xl border-2 border-[#2D2D2D] bg-[#F3F3F3] px-3 py-3 text-xs font-black text-[#2D2D2D] focus:outline-none focus:ring-4 ring-[#4ECDC4]/20"
              />
            </div>
          </div>

          {/* Notes / Coordinate info */}
          <div>
            <label className="block text-xs font-black text-[#2D2D2D] uppercase tracking-wider mb-1.5">
              Personal Message / Coordination Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-xl border-2 border-[#2D2D2D] bg-[#F3F3F3] px-3 py-2.5 text-xs font-bold text-[#2D2D2D] placeholder-[#2D2D2D]/40 focus:outline-none focus:ring-4 ring-[#4ECDC4]/20"
              placeholder="Suggest meeting locations (e.g. online, coffee shop), share your current skill level, or express your availability..."
            />
          </div>

          {/* Credit Math summary box */}
          <div className="rounded-2xl border-2 border-[#2D2D2D] bg-[#FFE66D]/10 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#2D2D2D]/60">Your Credit Balance:</span>
              <span className="font-black text-[#2D2D2D]">{currentProfile.credits.toFixed(1)} Credits</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#2D2D2D]/60">Session Cost:</span>
              <span className="font-black text-[#FF6B6B]">-{requiredCredits.toFixed(1)} Credits</span>
            </div>
            <hr className="border-[#2D2D2D]/10" />
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-[#2D2D2D]">Remaining Balance:</span>
              <span className={hasEnoughCredits ? "text-[#1D7A73]" : "text-[#FF6B6B]"}>
                {(currentProfile.credits - requiredCredits).toFixed(1)} Credits
              </span>
            </div>

            {!hasEnoughCredits && (
              <div className="mt-2.5 flex items-start gap-1.5 text-[10px] font-black text-[#2D2D2D] bg-[#FF6B6B]/10 rounded-xl p-3 border border-[#FF6B6B]/20">
                <ShieldAlert className="h-4.5 w-4.5 text-[#FF6B6B] shrink-0 stroke-[2.5]" />
                <span>Insufficient time credits. Share your skills to host exchanges and replenish your wallet!</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#2D2D2D] bg-white text-[#2D2D2D] font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasEnoughCredits}
              className="rounded-xl border-2 border-[#2D2D2D] bg-[#FF6B6B] text-white font-black px-4 py-2.5 text-xs shadow-[2px_2px_0px_#2D2D2D] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D2D2D] cursor-pointer disabled:opacity-40 transition-all"
            >
              {isSubmitting ? "Requesting..." : "Submit Exchange"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

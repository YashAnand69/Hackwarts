import React, { useState } from "react";
import { UserProfile, SwapRequest } from "../types";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
  db,
} from "../firebase";
import { validateBooking, localDateTime } from "../utils/lessonRules";
import {
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  Check,
  X,
  ShieldAlert,
  MapPin,
  Wand2,
} from "lucide-react";
import { playOwlPostChime, playWandSwoosh } from "../utils/audio";

interface SwapSchedulerProps {
  currentProfile: UserProfile | null;
  targetProfile: UserProfile;
  initialSkill: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FLOO_LOCATIONS = [
  "Room of Requirement",
  "Hogwarts Library (Restricted Section)",
  "Greenhouse 3 (Mandrakes)",
  "Great Hall Fireside",
  "Astronomy Tower",
  "Quidditch Pitch Stands",
  "Potions Dungeon B-4",
];

export default function SwapScheduler({
  currentProfile,
  targetProfile,
  initialSkill,
  onClose,
  onSuccess,
}: SwapSchedulerProps) {
  const [selectedSkill, setSelectedSkill] = useState(
    initialSkill || targetProfile.skills[0] || "",
  );
  const [duration, setDuration] = useState(1); // Hours
  const [dateTime, setDateTime] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(
    "Room of Requirement",
  );
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!currentProfile) return null;

  // Credit calculation: 1 credit per hour
  const requiredCredits = duration * 1;
  const hasEnoughCredits = currentProfile.credits >= requiredCredits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      validateBooking(
        currentProfile,
        targetProfile,
        selectedSkill,
        duration,
        dateTime,
      );
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    if (!selectedSkill) {
      setError("Please select a magical discipline or spellcraft to learn.");
      return;
    }
    if (!dateTime) {
      setError("Please pick a scheduled date and time.");
      return;
    }
    if (!hasEnoughCredits) {
      setError(
        "Insufficient Galleons! Tutor a classmate to earn Galleons before booking more spell trades.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const combinedNotes = `Location: ${selectedLocation}\n${notes}`.trim();

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
        notes: combinedNotes,
        createdAt: new Date().toISOString(),
        learnerReviewed: false,
        teacherReviewed: false,
      };

      const existing = await getDocs(
        query(
          collection(db, "swaps"),
          where("requesterId", "==", currentProfile.id),
        ),
      );
      const reserved = existing.docs
        .map((d) => d.data() as SwapRequest)
        .filter((s) => s.status === "pending" || s.status === "accepted")
        .reduce((sum, s) => sum + s.credits, 0);
      const clash = existing.docs.some((d) => {
        const s = d.data() as SwapRequest;
        const start = new Date(s.dateTime).getTime();
        const nextStart = new Date(swapData.dateTime).getTime();
        return (
          ["pending", "accepted"].includes(s.status) &&
          nextStart < start + s.duration * 3600000 &&
          start < nextStart + duration * 3600000
        );
      });
      if (clash)
        throw new Error(
          "You already have a lesson at this time. Choose another time.",
        );
      const bookingId = `${currentProfile.id}_${targetProfile.id}_${new Date(dateTime).getTime()}`;
      await runTransaction(db, async (tx) => {
        const learnerRef = doc(db, "users", currentProfile.id),
          tutorRef = doc(db, "users", targetProfile.id),
          bookingRef = doc(db, "swaps", bookingId);
        const [learner, tutor, booking] = await Promise.all([
          tx.get(learnerRef),
          tx.get(tutorRef),
          tx.get(bookingRef),
        ]);
        if (!learner.exists() || !tutor.exists())
          throw new Error("One of these profiles is no longer available.");
        if (booking.exists())
          throw new Error("A request for this time already exists.");
        validateBooking(
          learner.data() as UserProfile,
          tutor.data() as UserProfile,
          selectedSkill,
          duration,
          dateTime,
        );
        if (
          (learner.data() as UserProfile).credits - reserved <
          requiredCredits
        )
          throw new Error(
            "Your other lesson requests already use these Galleons.",
          );
        tx.set(bookingRef, swapData);
      });
      playOwlPostChime();
      onSuccess();
    } catch (err) {
      console.error("Scheduling error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to dispatch schedule owl. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#756e64]/60 p-4 backdrop-blur-xs animate-fade-in text-[#302d28] dark:text-[#eee9de]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plan a lesson"
        className="w-full max-w-lg rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#181f2e] p-6 sm:p-8 shadow-sm dark:shadow-lg animate-scale-up max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#856943] flex items-center justify-center text-[#c9ac77] border border-[#d9d1c1] dark:border-[#303747] shadow-sm">
              <Calendar className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-medium font-serif text-[#756e64] dark:text-[#c9ac77]">
                Propose Spell Trade 📜
              </h3>
              <span className="text-[10px] font-bold text-[#756e64]/60 dark:text-white/60">
                Dispatch an official Hogwarts Skill Exchange request
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close lesson planner"
            className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] p-1.5 text-[#756e64] dark:text-[#c9ac77] hover:bg-[#c9a66b]/20 cursor-pointer transition-all"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Teacher Snapshot */}
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-[#f4f0e7] dark:bg-[#1e2737] p-4 border border-[#d9d1c1] dark:border-[#303747] shadow-sm">
          <img
            src={targetProfile.photoURL}
            alt={targetProfile.displayName}
            className="h-12 w-12 rounded-xl object-cover border border-[#d9d1c1] dark:border-[#303747]"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[9px] font-medium text-[#856943] dark:text-[#c9a66b] uppercase tracking-wider block">
              SPELL TUTOR
            </span>
            <h4 className="text-sm font-medium font-serif text-[#756e64] dark:text-[#c9ac77] mt-0.5">
              {targetProfile.displayName}
            </h4>
            <p className="text-[10px] font-bold text-[#756e64]/70 dark:text-white/70 mt-0.5">
              ★ {targetProfile.rating.toFixed(1)} • {targetProfile.location}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#856943]/10 dark:bg-[#856943]/30 p-3 text-xs font-bold text-[#856943] dark:text-[#c9ac77] border border-[#856943]">
            <AlertCircle className="h-5 w-5 text-[#856943] shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Skill Selector */}
          <div>
            <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
              Which spellcraft do you wish to study?
            </label>
            <select
              aria-label="Lesson subject"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3 py-2.5 text-xs font-medium text-[#756e64] dark:text-white focus:outline-none"
            >
              <option value="">-- Choose spellcraft topic --</option>
              {targetProfile.skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Duration & Date-Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
                Lesson Duration
              </label>
              <select
                aria-label="Lesson duration"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3 py-2.5 text-xs font-medium text-[#756e64] dark:text-white focus:outline-none"
              >
                <option value={1}>1.0 Hour (1.0 Galleon)</option>
                <option value={1.5}>1.5 Hours (1.5 Galleons)</option>
                <option value={2}>2.0 Hours (2.0 Galleons)</option>
                <option value={3}>3.0 Hours (3.0 Galleons)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
                Owl Meeting Time
              </label>
              <input
                type="datetime-local"
                aria-label="Lesson date and time"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                min={localDateTime()}
                className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3 py-2 text-xs font-medium text-[#756e64] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Floo Location Presets */}
          <div>
            <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#856943] dark:text-[#c9a66b]" />
              Floo Network Meeting Point
            </label>
            <select
              aria-label="Meeting location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3 py-2.5 text-xs font-medium text-[#756e64] dark:text-white focus:outline-none"
            >
              {FLOO_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Coordinate info */}
          <div>
            <label className="block text-xs font-medium text-[#756e64] dark:text-[#c9ac77] uppercase tracking-wider mb-1.5">
              Personal Owl Note (Optional)
            </label>
            <textarea
              rows={2}
              aria-label="Lesson notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#f4f0e7] dark:bg-[#1e2737] px-3 py-2 text-xs font-semibold text-[#756e64] dark:text-white placeholder-[#756e64]/40 dark:placeholder-white/40 focus:outline-none"
              placeholder="e.g. Please bring your dragon-hide gloves, or I have spare parchment for incantation notes..."
            />
          </div>

          {/* Credit Math summary box */}
          <div className="rounded-2xl border border-[#d9d1c1] dark:border-[#303747] bg-[#c9a66b]/15 dark:bg-[#c9ac77]/10 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#756e64]/70 dark:text-white/70">
                Your Galleon Vault Balance:
              </span>
              <span className="font-medium text-[#756e64] dark:text-[#c9ac77]">
                {currentProfile.credits.toFixed(1)} Galleons
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#756e64]/70 dark:text-white/70">
                Exchange Fee (Escrowed upon finish):
              </span>
              <span className="font-medium text-[#856943] dark:text-[#c9ac77]">
                -{requiredCredits.toFixed(1)} Galleons
              </span>
            </div>
            <hr className="border-[#d9d1c1]/10 dark:border-white/10" />
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#756e64] dark:text-white">
                Post-Session Balance:
              </span>
              <span
                className={
                  hasEnoughCredits
                    ? "text-[#1A472A] dark:text-[#4ECDC4]"
                    : "text-[#856943]"
                }
              >
                {(currentProfile.credits - requiredCredits).toFixed(1)} Galleons
              </span>
            </div>

            {!hasEnoughCredits && (
              <div className="mt-2.5 flex items-start gap-1.5 text-[10px] font-medium text-[#856943] dark:text-[#c9ac77] bg-[#856943]/10 rounded-xl p-3 border border-[#856943]/30">
                <ShieldAlert className="h-4.5 w-4.5 text-[#856943] shrink-0 stroke-[2.5]" />
                <span>
                  Insufficient Galleons in your Gringotts vault. Tutor a
                  classmate to earn Galleons!
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lesson planner"
              className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#fffcf5] dark:bg-[#1e2737] text-[#756e64] dark:text-[#c9ac77] font-medium px-4 py-2.5 text-xs shadow-sm cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasEnoughCredits}
              className="rounded-xl border border-[#d9d1c1] dark:border-[#303747] bg-[#856943] text-[#c9ac77] font-medium px-6 py-2.5 text-xs shadow-sm dark:shadow-lg cursor-pointer disabled:opacity-40 transition-all active:translate-y-0.5"
            >
              {isSubmitting ? "Dispatching Owl..." : "Dispatch Request Owl 🦉"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
